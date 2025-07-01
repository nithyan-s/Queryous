import re
from fastapi import HTTPException
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text  # make sure text is imported


def configure_db(db_type: str, host: str, user: str, password: str, database: str):
    """
    Establishes a connection to the specified database using SQLAlchemy.

    Args:
        db_type (str): Type of the database ('mysql' or 'postgresql').
        host (str): Database host address.
        user (str): Username for authentication.
        password (str): Password for authentication.
        database (str): Name of the database.

    Returns:
        engine: SQLAlchemy engine object.

    Raises:
        HTTPException: If the database type is unsupported or connection fails.
    """

    try:
        print(f"Attempting to connect to {host}...")
        
        # Connection parameters including timeouts
        connect_args = {
            "connect_timeout": 10,  # 10 seconds timeout for connection attempt
        }
        
        if db_type == "mysql":
            conn_string = f"mysql+mysqlconnector://{user}:{password}@{host}/{database}"
        elif db_type == "postgresql":
            conn_string = f"postgresql+psycopg2://{user}:{password}@{host}/{database}"
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported database type: {db_type}. Choose 'mysql' or 'postgresql'.")

        # Create engine with connect_args
        engine = create_engine(conn_string, connect_args=connect_args)
        
        # Test connection with a simple query
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print(f"Successfully connected to {db_type} database at {host}")
        
        return engine

    except SQLAlchemyError as e:
        error_msg = str(e)
        
        # Check for common connection errors and provide more helpful messages
        if "10060" in error_msg:
            detail = f"Cannot connect to database server at {host}. Possible causes:\n" \
                     f"1. Server is not accessible from your network (firewall or VPN issue)\n" \
                     f"2. Database server is down or not accepting connections\n" \
                     f"3. Database name or credentials are incorrect\n\n" \
                     f"Original error: {error_msg}"
        else:
            detail = f"Database connection error: {error_msg}"
        
        print(f"❌ Connection failed: {detail}")
        raise HTTPException(status_code=500, detail=detail)



def get_database_schema(engine):
    """
    Extracts the schema (tables and columns) from the connected database.

    Args:
        engine: SQLAlchemy engine object.

    Returns:
        dict: Dictionary of table names and their columns.
    """
    inspector = inspect(engine)
    schema = {}

    for table in inspector.get_table_names():
        columns = inspector.get_columns(table)
        schema[table] = [col['name'] for col in columns]

    return schema


def format_schema_for_prompt(schema_dict):
    """
    Formats the schema dictionary into a clear, detailed string for LLM prompts.

    Args:
        schema_dict (dict): Dictionary of table names and columns.

    Returns:
        str: Formatted schema string with clear structure.
    """
    if not schema_dict:
        return "No database schema available."
    
    prompt = "AVAILABLE DATABASE SCHEMA:\n"
    prompt += "=" * 50 + "\n\n"
    
    for table, columns in schema_dict.items():
        prompt += f"TABLE: {table}\n"
        prompt += f"COLUMNS: {', '.join(columns)}\n"
        prompt += "-" * 30 + "\n"
    
    prompt += "\nIMPORTANT: Only use tables and columns listed above. Do not use any other table or column names.\n"
    return prompt


def extract_sql_query(agent_response):
    """
    Extracts a clean SQL query from the LLM's response.

    Args:
        agent_response (str): Raw response from the LLM.

    Returns:
        str: Cleaned SQL query with any trailing semicolons removed.

    Raises:
        ValueError: If no valid SQL query is found.
    """
    if re.match(r'^[\d.]+$', agent_response.strip()):
        raise ValueError(f"Agent returned a numeric value instead of SQL: {agent_response}")

    sql_match = re.search(r'```sql\s*(.*?)\s*```', agent_response, re.DOTALL)
    if sql_match:
        sql = sql_match.group(1).strip()
        # Remove trailing semicolons that cause issues when used as subqueries
        return sql.rstrip(';')

    sql_match = re.search(r'`(.*?)`', agent_response, re.DOTALL)
    if sql_match:
        sql = sql_match.group(1).strip()
        return sql.rstrip(';')

    sql_keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'SHOW']
    for keyword in sql_keywords:
        sql_match = re.search(f'{keyword}\\s+.*', agent_response, re.IGNORECASE | re.DOTALL)
        if sql_match:
            sql = sql_match.group(0).strip()
            return sql.rstrip(';')

    if any(keyword in agent_response.upper() for keyword in sql_keywords):
        sql = agent_response.strip()
        return sql.rstrip(';')

    raise ValueError(f"Could not identify SQL query in agent response: {agent_response}")


def is_valid_sql(query):
    """
    Validates whether the SQL query is a safe and expected SELECT statement.

    Args:
        query (str): SQL query string.

    Returns:
        bool: True if valid, False otherwise.
    """
    if re.match(r'^[\d.]+$', query.strip()):
        return False

    if not query.upper().strip().startswith('SELECT'):
        return False

    select_keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT']
    return any(keyword.upper() in query.upper() for keyword in select_keywords)


