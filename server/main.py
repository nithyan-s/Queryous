"""
Data Analytics Chatbot API Server

This module contains the FastAPI application with endpoint definitions.
Business logic and utilities are imported from separate modules.
"""

# Standard library imports
import traceback
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import altair as alt
import io

# Local imports
from db import (
    configure_db, 
    get_database_schema, 
    format_schema_for_prompt, 
    extract_sql_query, 
    is_valid_sql
)
from services import (
    query_llm, 
    summarize_results, 
    execute_query, 
    generate_auto_chart
)
from utils import (
    LLM_API_URL,
    LLM_API_KEY,
    MYSQL_SYSTEM_PROMPT,
    CSV_SYSTEM_PROMPT,
    app_state,
    clean_sql_query,
    sanitize_table_name,
    generate_csv_schema,
    process_csv_upload,
    setup_csv_engine,
    calculate_pagination,
    get_total_row_count,
    execute_paginated_query,
    prepare_visualization_data,
    prepare_summary_data,
    create_response_message,
    export_to_csv,
    Timer,
    validate_file_upload,
    validate_query_input,
    format_error_message,
    log_error
)

# Authentication imports
from auth_routes import router as auth_router

# FASTAPI APPLICATION SETUP

# Enable json data transformer for Altair (instead of vegafusion to avoid dependency issues)
alt.data_transformers.enable("json")

# Initialize FastAPI application with metadata
app = FastAPI(
    title="Data Analytics Chatbot API", 
    version="1.3.0",
    description="Intelligent SQL query generation and data visualization API",
    docs_url="/docs",  
    redoc_url="/redoc" 
)

# Configure CORS middleware to allow cross-origin requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://queryous.imnitz.tech"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routes
app.include_router(auth_router)

class QueryRequest(BaseModel):
    """
    Request model for natural language queries.
    
    """
    query: str
    limit: Optional[int] = 1000
    page: Optional[int] = 1

class QueryResponse(BaseModel):
    """
    Response model containing query results and metadata.
    
    """
    response: str
    sql_query: Optional[str] = None
    execution_time: Optional[float] = None
    visualization: Optional[str] = None
    data: Optional[list] = None
    summary: Optional[str] = None
    title: Optional[str] = None
    total_rows: Optional[int] = None
    returned_rows: Optional[int] = None
    page: Optional[int] = None
    has_more: Optional[bool] = None

class DBCredentials(BaseModel):
    """
    Database connection credentials model.
    
    Attributes:
        type (str): Database type ('mysql' or 'postgresql')
        url (str): Database host URL or IP address
        name (str): Database name
        username (str): Database username
        password (str): Database password
    """
    type: str
    url: str
    name: str
    username: str
    password: str

# DATABASE CONNECTION ENDPOINTS

@app.post("/connect-db")
async def connect_database(credentials: DBCredentials):
    """
    Establish connection to the database and load schema information.
    
    """
    try:
        print(f"Attempting to connect to {credentials.type} database at {credentials.url}")
        
        # Configure and establish database connection
        app_state.db_engine = configure_db(
            db_type=credentials.type, 
            host=credentials.url,
            user=credentials.username,
            password=credentials.password,
            database=credentials.name
        )
        
        # Extract database schema and format for LLM context
        schema = get_database_schema(app_state.db_engine)
        app_state.schema_prompt = format_schema_for_prompt(schema)

        print("Connected to database and schema loaded successfully.")
        return {"message": "Connected to database and schema loaded successfully."}
        
    except Exception as e:
        error_msg = format_error_message(e, "Failed to connect to database")
        log_error(e, "Database connection")
        raise HTTPException(status_code=500, detail=error_msg)


@app.post("/disconnect-db")
async def disconnect_database():
    """
    Disconnect from the current database and clear schema information.
    
    """
    app_state.reset_database_connection()
    
    print("Disconnected from database.")
    return {"message": "Disconnected from database successfully."}

# APPLICATION LIFECYCLE EVENTS

@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler.
    
    This function is called when the FastAPI application starts.
    It initializes the server and logs the startup status.
    """
    print("Data Analytics Chatbot API Server started successfully!")
    print("Server is ready to accept database connections...")
    print("API documentation available at: /docs")

# MAIN QUERY PROCESSING ENDPOINT

@app.post("/ask", response_model=QueryResponse)
async def process_natural_language_query(request: QueryRequest):
    """
    Process a natural language query and return structured results.
    
    This endpoint handles both database and CSV queries based on current mode.
    
    """
    with Timer() as timer:
        try:
            # Extract and validate the user query
            user_query = validate_query_input(request.query)
                
            # Extract pagination parameters
            limit, offset = calculate_pagination(request.page, request.limit)
            page = request.page
                
            print(f"1. Received query: {user_query} (limit: {limit}, page: {page})")
            print(f"   Mode: {'CSV' if app_state.is_csv_mode else 'Database'}")

            # Check if we have a data source
            if app_state.is_csv_mode and not app_state.csv_engine:
                raise ValueError("No CSV data uploaded")
            elif not app_state.is_csv_mode and not app_state.db_engine:
                raise ValueError("No database connection established")

            # Step 1: Generate SQL query using LLM
            print("2. Generating SQL query using LLM...")
            
            # Use appropriate system prompt based on mode
            current_system_prompt = CSV_SYSTEM_PROMPT if app_state.is_csv_mode else MYSQL_SYSTEM_PROMPT
            
            llm_response = query_llm(
                user_prompt=user_query, 
                system_prompt=current_system_prompt, 
                schema_prompt=app_state.schema_prompt, 
                llm_api_url=LLM_API_URL, 
                llm_api_key=LLM_API_KEY
            )
            
            # Clean the SQL query
            original_sql = extract_sql_query(llm_response)
            print(f"3. Generated SQL: {original_sql}")

            # Step 2: Validate SQL query syntax and safety
            if not is_valid_sql(original_sql):
                raise ValueError("Generated SQL query is invalid or unsafe")

            # Step 3: Get total count and execute paginated query
            total_rows = get_total_row_count(
                original_sql, 
                app_state.csv_engine if app_state.is_csv_mode else app_state.db_engine,
                app_state.is_csv_mode
            )
            
            result_dataframe = execute_paginated_query(
                original_sql,
                limit,
                offset,
                app_state.csv_engine if app_state.is_csv_mode else app_state.db_engine,
                app_state.is_csv_mode
            )
            
            # Convert dataframe to JSON-serializable format
            query_results = result_dataframe.to_dict(orient='records')
            returned_rows = len(query_results)
            has_more = offset + returned_rows < total_rows
            
            print(f"4. Query returned {returned_rows} rows (page {page} of {total_rows} total)")

            # Step 4: Generate automatic visualization using sample data for large datasets
            visualization_json = None
            if not result_dataframe.empty:
                print("5. Generating automatic visualization...")
                viz_data = prepare_visualization_data(result_dataframe)
                visualization_json = generate_auto_chart(viz_data)

            # Step 5: Generate AI-powered summary and title using sample data
            print("6. Generating AI summary and title...")
            
            summary_data = prepare_summary_data(query_results)
            
            # Include pagination info in the summary context
            summary_context = f"Showing {returned_rows} rows (page {page}) out of {total_rows} total rows."
            data_source = "CSV data" if app_state.is_csv_mode else "database"
            enhanced_query = f"{user_query}\n\nContext: {summary_context} from {data_source}."
            
            result_summary = summarize_results(
                query=enhanced_query, 
                sql_query=original_sql, 
                result_data=summary_data, 
                llm_api_url=LLM_API_URL, 
                llm_api_key=LLM_API_KEY, 
                task="summary"
            )
            
            result_title = summarize_results(
                query=user_query, 
                sql_query=original_sql, 
                result_data=summary_data, 
                llm_api_url=LLM_API_URL, 
                llm_api_key=LLM_API_KEY, 
                task="title"
            )

            print(f"Query processed successfully in {timer.elapsed_time}s")
            print(f"Summary: {result_summary}")
            print(f"Title: {result_title}")

            # Create response message
            response_msg = create_response_message(
                total_rows, returned_rows, page, limit, app_state.is_csv_mode
            )

            # Return comprehensive response
            return QueryResponse(
                response=response_msg,
                sql_query=original_sql,
                execution_time=timer.elapsed_time,
                visualization=visualization_json,
                data=query_results,
                summary=result_summary,
                title=result_title,
                total_rows=total_rows,
                returned_rows=returned_rows,
                page=page,
                has_more=has_more
            )
            
        except Exception as e:
            # Log detailed error information for debugging
            log_error(e, f"Query processing after {timer.elapsed_time}s")
            
            # Return user-friendly error response
            raise HTTPException(
                status_code=500, 
                detail=format_error_message(e, "Failed to process query")
            )

# ADDITIONAL DATA RETRIEVAL ENDPOINT

@app.post("/get-more-data")
async def get_more_data(request: dict):
    """
    Retrieve additional pages of data for a previously executed query.
    
    This endpoint allows fetching more data from large result sets without
    re-executing the entire query processing pipeline.

    """
    try:
        sql_query = request.get("sql_query")
        page = max(request.get("page", 1), 1)
        limit = min(request.get("limit", 1000), 5000)
        offset = (page - 1) * limit
        
        if not sql_query:
            raise ValueError("SQL query is required")
            
        # Validate SQL query
        if not is_valid_sql(sql_query):
            raise ValueError("Invalid SQL query")
        
        # Get total count and execute query
        total_rows = get_total_row_count(
            sql_query, 
            app_state.csv_engine if app_state.is_csv_mode else app_state.db_engine,
            app_state.is_csv_mode
        )
        
        result_dataframe = execute_paginated_query(
            sql_query,
            limit,
            offset,
            app_state.csv_engine if app_state.is_csv_mode else app_state.db_engine,
            app_state.is_csv_mode
        )
        
        query_results = result_dataframe.to_dict(orient='records')
        returned_rows = len(query_results)
        has_more = offset + returned_rows < total_rows
        
        return {
            "data": query_results,
            "total_rows": total_rows,
            "returned_rows": returned_rows,
            "page": page,
            "has_more": has_more,
            "message": f"Retrieved {returned_rows} rows from page {page}"
        }
        
    except Exception as e:
        log_error(e, "Additional data retrieval")
        raise HTTPException(status_code=500, detail=format_error_message(e, "Failed to retrieve data"))

# CSV UPLOAD AND EXPORT ENDPOINTS

@app.post("/upload-csv")
async def upload_csv_file(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not validate_file_upload(file.filename, "csv"):
            raise ValueError("Only CSV files are supported")
        
        print(f"Uploading CSV file: {file.filename}")
        
        # Read and process CSV content
        content = await file.read()
        table_name, csv_data, metadata = process_csv_upload(content, file.filename)
        
        # Store the DataFrame
        app_state.uploaded_csvs[table_name] = csv_data
        
        # Setup CSV engine
        app_state.csv_engine = setup_csv_engine(app_state.uploaded_csvs)
        
        # Generate schema and set CSV mode
        schema_prompt = generate_csv_schema(app_state.uploaded_csvs)
        app_state.set_csv_mode(app_state.uploaded_csvs, schema_prompt)
        
        print(f"Generated schema prompt:\n{schema_prompt}")
        print(f"Successfully uploaded CSV: {file.filename} as table '{table_name}'")
        print(f"Table has {len(csv_data)} rows and {len(csv_data.columns)} columns")
        
        return {
            "message": f"CSV file uploaded successfully as table '{table_name}'",
            **metadata
        }
        
    except Exception as e:
        log_error(e, "CSV upload")
        raise HTTPException(status_code=500, detail=format_error_message(e, "Failed to upload CSV"))

@app.post("/export-csv")
async def export_query_results(request: dict):
    try:
        sql_query = request.get("sql_query", "")
        filename = request.get("filename", "query_results.csv")
        
        if not sql_query:
            raise ValueError("No SQL query provided for export")
        
        print(f"Exporting query results to CSV: {filename}")
        
        # Execute query based on current mode
        if app_state.is_csv_mode and app_state.csv_engine:
            # Query CSV data using DuckDB
            result_df = app_state.csv_engine.execute(sql_query).fetchdf()
        else:
            # Query database
            if not app_state.db_engine:
                raise ValueError("No database connection available")
            result_df = execute_query(sql_query, app_state.db_engine)
        
        # Export to CSV
        csv_content, headers = export_to_csv(result_df, filename)
        
        print(f"Successfully exported {len(result_df)} rows to CSV")
        
        return StreamingResponse(
            io.StringIO(csv_content), 
            media_type="text/csv",
            headers=headers
        )
        
    except Exception as e:
        log_error(e, "CSV export")
        raise HTTPException(status_code=500, detail=format_error_message(e, "Failed to export CSV"))

@app.get("/csv-status")
async def get_csv_status():
    return {
        "is_csv_mode": app_state.is_csv_mode,
        "tables_count": len(app_state.uploaded_csvs),
        "schema_prompt": app_state.schema_prompt,
        "tables": [
            {
                "name": name,
                "rows": len(df),
                "columns": list(df.columns)
            }
            for name, df in app_state.uploaded_csvs.items()
        ] if app_state.uploaded_csvs else []
    }

@app.post("/clear-csv")
async def clear_csv_data():
    app_state.reset_csv_state()
    
    print("Cleared all CSV data - back to database mode")
    
    return {
        "message": "CSV data cleared successfully",
        "is_csv_mode": False
    }

# UTILITY & HEALTH CHECK ENDPOINTS

@app.get("/")
async def root():
    return {
        "message": "Data Analytics Chatbot API is running!",
        "version": "1.3.0",
        "status": "operational",
        "documentation": "/docs",
        "health_check": "/health"
    }

@app.get("/health")
async def health_check():
    import time
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "database_connected": app_state.db_engine is not None,
        "schema_loaded": bool(app_state.schema_prompt),
        "csv_mode": app_state.is_csv_mode,
        "version": "1.3.0"
    }

# APPLICATION ENTRY POINT

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )
