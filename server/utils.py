"""
Utility functions for the Data Analytics Chatbot API Server

This module contains helper functions for:
- Application configuration
- CSV processing and management
- Data processing utilities
- State management helpers
"""

import os
import re
import io
import time
import pandas as pd
import duckdb
from typing import Dict, Optional, Tuple, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# CONFIGURATION CONSTANTS

# API Configuration
LLM_API_URL = os.getenv("LLM_API_URL")
LLM_API_KEY = os.getenv("LLM_API_KEY")

# System prompts for different modes
MYSQL_SYSTEM_PROMPT = """
You are a precise SQL query generator for data analytics. Your ONLY task is to generate accurate SELECT queries based on the provided database schema.

CRITICAL RULES - FOLLOW EXACTLY:
1. ONLY use tables and columns that exist in the provided schema - NEVER invent or assume any tables/columns
2. If a requested table or column doesn't exist in the schema, respond EXACTLY: "I don't know"
3. Generate ONLY SELECT queries - no INSERT, UPDATE, DELETE, CREATE, DROP operations
4. Return ONLY the SQL query - no explanations, comments, or additional text
5. Use proper SQL syntax for the database type specified
6. Do not add LIMIT clauses unless specifically requested by the user
7. Use appropriate JOINs when querying multiple tables
8. Handle date/time queries using proper SQL date functions

VALIDATION CHECKLIST:
- All table names exist in schema
- All column names exist in their respective tables  
- JOIN conditions use valid foreign key relationships
- Data types are compatible in WHERE conditions
- Aggregate functions are used correctly

EXAMPLE INTERACTIONS (FOR REFERENCE ONLY):

Schema Example:
```
Table: customers
- id (INT, PRIMARY KEY)
- name (VARCHAR)
- email (VARCHAR)
- created_date (DATE)

Table: orders
- order_id (INT, PRIMARY KEY)
- customer_id (INT, FOREIGN KEY)
- product_name (VARCHAR)
- amount (DECIMAL)
- order_date (DATE)
```

User: "Show me all customers"
Response: SELECT * FROM customers

User: "Get total sales by customer"
Response: SELECT c.name, SUM(o.amount) as total_sales FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id, c.name

User: "Show products from inventory table"
Response: I don't know

User: "Get customers who ordered in last 30 days"
Response: SELECT DISTINCT c.* FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)

REMEMBER: These examples are for reference only. Always use the actual schema provided in the current request.
"""

CSV_SYSTEM_PROMPT = """
You are a precise SQL query generator for CSV data analytics using DuckDB syntax. Your ONLY task is to generate accurate SELECT queries based on the provided CSV schema.

CRITICAL RULES - FOLLOW EXACTLY:
1. ONLY use tables and columns that exist in the provided CSV schema - NEVER invent or assume any tables/columns
2. If a requested table or column doesn't exist in the schema, respond EXACTLY: "I don't know"
3. Generate ONLY SELECT queries using DuckDB syntax - no INSERT, UPDATE, DELETE, CREATE, DROP operations
4. Return ONLY the SQL query - no explanations, comments, or additional text
5. ALWAYS put table names in double quotes: FROM "table_name"
6. Put column names in double quotes if they contain spaces or special characters: "column name"
7. Do not add LIMIT clauses unless specifically requested by the user
8. Use DuckDB-specific functions and syntax
9. Handle date/time queries using DuckDB date functions (strptime, date_trunc, etc.)

VALIDATION CHECKLIST:
- All table names exist in CSV schema and are in double quotes
- All column names exist in their respective tables
- Column names with spaces/special chars are properly quoted
- Using DuckDB syntax (not MySQL/PostgreSQL)
- Data types are compatible in WHERE conditions
- Aggregate functions are used correctly

EXAMPLE INTERACTIONS (FOR REFERENCE ONLY):

CSV Schema Example:
```
Table "sales_data" (1000 rows):
- "Product Name" (object) - examples: Laptop, Phone, Tablet
- "Sales Amount" (float64) - examples: 1200.50, 899.99, 450.00
- "Sale Date" (object) - examples: 2024-01-15, 2024-02-20, 2024-03-10
- region (object) - examples: North, South, East

Table "customer_info" (500 rows):
- customer_id (int64) - examples: 1, 2, 3
- "Customer Name" (object) - examples: John Doe, Jane Smith, Bob Wilson
- age (int64) - examples: 25, 34, 45
```

User: "Show me all sales data"
Response: SELECT * FROM "sales_data"

User: "Get total sales by region"
Response: SELECT region, SUM("Sales Amount") as total_sales FROM "sales_data" GROUP BY region

User: "Show inventory from warehouse table"
Response: I don't know

User: "Get sales for laptops only"
Response: SELECT * FROM "sales_data" WHERE "Product Name" = 'Laptop'

User: "Average age of customers"
Response: SELECT AVG(age) as average_age FROM "customer_info"

User: "Sales by month"
Response: SELECT date_trunc('month', strptime("Sale Date", '%Y-%m-%d')) as month, SUM("Sales Amount") as monthly_sales FROM "sales_data" GROUP BY date_trunc('month', strptime("Sale Date", '%Y-%m-%d')) ORDER BY month

REMEMBER: These examples are for reference only. Always use the actual CSV schema provided in the current request.
"""

# APPLICATION STATE MANAGEMENT

class ApplicationState:
    """Manages the global application state"""
    
    def __init__(self):
        self.db_engine = None
        self.schema_prompt = ""
        self.uploaded_csvs: Dict[str, pd.DataFrame] = {}
        self.csv_engine = None
        self.is_csv_mode = False
    
    def reset_database_connection(self):
        """Reset database connection state"""
        self.db_engine = None
        self.schema_prompt = ""
    
    def reset_csv_state(self):
        """Reset CSV state"""
        self.uploaded_csvs = {}
        self.csv_engine = None
        self.is_csv_mode = False
        self.schema_prompt = ""
    
    def set_csv_mode(self, csv_data: Dict[str, pd.DataFrame], schema_prompt: str):
        """Set application to CSV mode"""
        self.uploaded_csvs = csv_data
        self.schema_prompt = schema_prompt
        self.is_csv_mode = True
        self.db_engine = None  # Disconnect from database when switching to CSV

# Global application state instance
app_state = ApplicationState()

# CSV PROCESSING UTILITIES

def sanitize_table_name(filename: str) -> str:
    """
    Sanitize a filename to create a valid SQL table name.
    
    """
    # Remove .csv extension and replace spaces/hyphens with underscores
    table_name = filename.replace('.csv', '').replace(' ', '_').replace('-', '_').lower()
    # Remove any special characters that might cause SQL issues
    table_name = re.sub(r'[^a-zA-Z0-9_]', '_', table_name)
    return table_name

def generate_csv_schema(csvs: Dict[str, pd.DataFrame]) -> str:
    """
    Generate schema prompt for CSV tables.
    
    """
    csv_schema_lines = ["CSV Tables Schema:"]
    
    for tbl_name, df in csvs.items():
        # Create detailed schema with sample values
        columns_info = []
        for col in df.columns:
            dtype = str(df[col].dtype)
            # Get sample unique values for better context
            sample_values = df[col].dropna().unique()[:3]
            sample_str = ", ".join([str(v) for v in sample_values])
            # Quote column names that might have spaces or special characters
            col_quoted = f'"{col}"' if ' ' in col or '-' in col else col
            columns_info.append(f"`{col_quoted}` ({dtype}) - examples: {sample_str}")
        
        columns_desc = "\n    ".join(columns_info)
        # Always quote table names to be safe
        csv_schema_lines.append(f'\nTable "{tbl_name}" ({len(df)} rows):')
        csv_schema_lines.append(f"    {columns_desc}")
    
    return "\n".join(csv_schema_lines)

def process_csv_upload(file_content: bytes, filename: str) -> Tuple[str, pd.DataFrame, Dict[str, Any]]:
    """
    Process uploaded CSV file and return relevant data.
 
    """
    # Read CSV content
    csv_data = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
    
    # Generate table name
    table_name = sanitize_table_name(filename)
    
    # Prepare metadata
    metadata = {
        "table_name": table_name,
        "rows": len(csv_data),
        "columns": list(csv_data.columns),
        "sample_data": csv_data.head(5).to_dict(orient='records'),
        "is_csv_mode": True
    }
    
    return table_name, csv_data, metadata

def setup_csv_engine(csvs: Dict[str, pd.DataFrame]) -> duckdb.DuckDBPyConnection:
    """
    Setup DuckDB engine and register CSV tables.

    """
    engine = duckdb.connect(':memory:')
    
    # Register all DataFrames as tables
    for table_name, df in csvs.items():
        engine.register(table_name, df)
    
    return engine

# DATA PROCESSING UTILITIES

def calculate_pagination(page: int, limit: int) -> Tuple[int, int]:
    """
    Calculate pagination parameters.

    """
    validated_limit = min(limit, 5000)  # Cap at 5000 rows max
    validated_page = max(page, 1)  # Ensure page is at least 1
    offset = (validated_page - 1) * validated_limit
    
    return validated_limit, offset

def get_total_row_count(sql_query: str, engine, is_csv: bool = False) -> int:
    """
    Get total row count for a query.

    """
    try:
        # Remove any existing LIMIT/OFFSET clauses from the query for counting
        # This is important for CSV queries where the LLM might add LIMIT
        clean_query = clean_sql_query(sql_query)        
        count_sql = f"SELECT COUNT(*) as total_count FROM ({clean_query}) as count_query"
        
        if is_csv:
            count_result = engine.execute(count_sql).fetchone()
            return count_result[0] if count_result else 0
        else:
            from services import execute_query
            count_result = execute_query(count_sql, engine)
            return count_result.iloc[0]['total_count'] if not count_result.empty else 0
            
    except Exception as e:
        print(f"Count query failed: {str(e)}")
        # Fallback: execute original query and count results
        if is_csv:
            try:
                # For fallback, also remove LIMIT/OFFSET from original query
                clean_fallback_query = clean_sql_query(sql_query)
                temp_result = engine.execute(clean_fallback_query).fetchdf()
                return len(temp_result)
            except Exception as e2:
                print(f"Fallback count also failed: {str(e2)}")
                raise ValueError(f"Query execution failed: {str(e2)}")
        else:
            raise ValueError(f"Count query failed: {str(e)}")

def execute_paginated_query(sql_query: str, limit: int, offset: int, engine, is_csv: bool = False) -> pd.DataFrame:
    """
    Execute a paginated SQL query.
  
    """
    # Remove any existing LIMIT/OFFSET clauses from the query before adding our own
    # This prevents double LIMIT/OFFSET clauses that cause syntax errors
    clean_query = clean_sql_query(sql_query)
    
    # Add our pagination
    paginated_sql = f"{clean_query} LIMIT {limit} OFFSET {offset}"
    
    if is_csv:
        return engine.execute(paginated_sql).fetchdf()
    else:
        from services import execute_query
        return execute_query(paginated_sql, engine)

def prepare_visualization_data(dataframe: pd.DataFrame, max_rows: int = 1000) -> pd.DataFrame:
    """
    Prepare data for visualization by limiting rows if necessary.

    """
    return dataframe.head(max_rows) if len(dataframe) > max_rows else dataframe

def prepare_summary_data(query_results: List[Dict], max_rows: int = 100) -> List[Dict]:
    """
    Prepare data for AI summary by limiting rows if necessary.

    """
    return query_results[:max_rows] if len(query_results) > max_rows else query_results

def create_response_message(total_rows: int, returned_rows: int, page: int, limit: int, is_csv: bool) -> str:
    """
    Create appropriate response message based on result size.

    """
    data_source_msg = "CSV data" if is_csv else "database"
    
    if total_rows > limit:
        return f"Query executed successfully on {data_source_msg}. Showing {returned_rows} rows from page {page} of {total_rows} total rows."
    else:
        return f"Query executed successfully on {data_source_msg}. Returned {returned_rows} rows."

# EXPORT UTILITIES

def export_to_csv(dataframe: pd.DataFrame, filename: str = "query_results.csv") -> Tuple[str, Dict[str, str]]:
    """
    Export DataFrame to CSV format.

    """
    if dataframe.empty:
        raise ValueError("Query returned no results to export")
    
    # Convert DataFrame to CSV
    csv_buffer = io.StringIO()
    dataframe.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    # Create headers
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
    }
    
    return csv_content, headers

# TIMING AND PERFORMANCE UTILITIES

class Timer:
    """Simple timer context manager for performance monitoring"""
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
    
    @property
    def elapsed_time(self) -> float:
        """Get elapsed time in seconds, rounded to 2 decimal places"""
        if self.start_time and self.end_time:
            return round(self.end_time - self.start_time, 2)
        return 0.0

# VALIDATION UTILITIES

def validate_file_upload(filename: str, file_type: str = "csv") -> bool:
    """
    Validate uploaded file.
   
    """
    if file_type == "csv":
        return filename.lower().endswith('.csv')
    return False

def validate_query_input(query: str) -> str:
    """
    Validate and clean query input.

    """
    cleaned_query = query.strip()
    if not cleaned_query:
        raise ValueError("Query cannot be empty")
    return cleaned_query

# ERROR HANDLING UTILITIES

def format_error_message(error: Exception, context: str = "") -> str:
    """
    Format error message for consistent error handling.

    """
    error_msg = str(error)
    if context:
        return f"{context}: {error_msg}"
    return error_msg

def log_error(error: Exception, context: str = "", include_traceback: bool = True):
    """
    Log error with optional traceback.

    """
    import traceback
    
    error_msg = format_error_message(error, context)
    print(f"❌ Error: {error_msg}")
    
    if include_traceback:
        traceback.print_exc()

## Bug Fix: SQL Query must not have LIMIT or OFFSET clauses
def clean_sql_query(sql_query: str) -> str:
    """
    Clean SQL query by removing:
    1. LIMIT and OFFSET clauses
    2. Trailing semicolons
    3. Any extra whitespace
    
    This is useful when we need to count total rows or apply our own pagination
    to a query that might already have LIMIT/OFFSET clauses from the LLM.
    
    """
    import re
    clean_query = sql_query.strip()
    
    # Remove LIMIT and OFFSET clauses (case-insensitive)
    clean_query = re.sub(r'\s+LIMIT\s+\d+', '', clean_query, flags=re.IGNORECASE)
    clean_query = re.sub(r'\s+OFFSET\s+\d+', '', clean_query, flags=re.IGNORECASE)
    
    # Remove trailing semicolons that cause issues in subqueries
    clean_query = clean_query.rstrip(';')
    
    return clean_query
