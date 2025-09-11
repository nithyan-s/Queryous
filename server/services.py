# services.py
# Contains llm communication logic split from main.py for modularity

import requests
import json
import pandas as pd
import altair as alt
import time
import traceback
from fastapi import HTTPException

# LLM Communication

def query_llm(user_prompt: str, system_prompt: str, schema_prompt: str, llm_api_url: str, llm_api_key: str) -> str:
    full_prompt = f"{schema_prompt}\n\nUser question: {user_prompt}"
    
    # Groq API configuration for Llama model
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {llm_api_key}"
    }
    
    data = {
        "model": "llama3-70b-8192",
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": full_prompt,
            }
        ],
        "max_tokens": 512,  # Shorter responses for just SQL
        "temperature": 0.1,  # Very low temperature for precise SQL generation
        "top_p": 0.95,  # Higher topP for better quality
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0,
    }
    
    try:
        response = requests.post(llm_api_url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"].strip()
    except requests.exceptions.RequestException as e:
        print(f"Error calling Groq API: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to communicate with LLM: {e}")
    except KeyError as e:
        print(f"Unexpected API response format: {e}")
        raise HTTPException(status_code=500, detail="Invalid response from LLM service")


def summarize_results(query, sql_query, result_data, llm_api_url, llm_api_key, task="summary"):
    prompt = f"""
        Question: {query}
        SQL Query: {sql_query}
        SQL Result: {json.dumps(result_data)}

        Please provide a {"clear, concise summary about a sentence." if task == "summary" else "short title (5-8 words)"} of these results.
    """
    
    # Azure OpenAI configuration
    model_name = "gpt-4.1"
    deployment = "gpt-4.1-propel-exp"
    api_version = "2024-12-01-preview"
    
    client = AzureOpenAI(
        api_version=api_version,
        azure_endpoint=llm_api_url,  # Using the endpoint from parameters
        api_key=llm_api_key,
    )
    
    response = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant that provides clear summaries of data analysis results.",
            },
            {
                "role": "user",
                "content": prompt,
            }
        ],
        max_completion_tokens=246,
        temperature=0.8,
        top_p=1.0,
        frequency_penalty=0.0,
        presence_penalty=0.0,
        model=deployment
    )
    
    return response.choices[0].message.content.strip()


def execute_query(sql_query: str, db_engine) -> pd.DataFrame:
    try:
        if db_engine is None:
            raise Exception("Database engine not initialized.")
        df = pd.read_sql_query(sql_query, db_engine)
        return df
    except Exception as e:
        print("Query execution failed:", str(e))
        traceback.print_exc()
        return pd.DataFrame()


def generate_auto_chart(df):
    if df.empty:
        return None
    if df.shape[1] == 1:
        counts = df[df.columns[0]].value_counts().reset_index()
        counts.columns = [df.columns[0], 'count']
        chart = alt.Chart(counts).mark_bar().encode(
            x=alt.X(df.columns[0], type='nominal'),
            y=alt.Y('count', type='quantitative')
        )
    elif 'date' in df.columns or 'time' in df.columns:
        time_col = 'date' if 'date' in df.columns else 'time'
        chart = alt.Chart(df).mark_line().encode(
            x=alt.X(f'{time_col}:T'),
            y=alt.Y(df.columns[1], type='quantitative')
        )
    elif df.select_dtypes(include=['object']).shape[1] > 0 and df.select_dtypes(include=['number']).shape[1] > 0:
        cat_col = df.select_dtypes(include=['object']).columns[0]
        num_col = df.select_dtypes(include=['number']).columns[0]
        chart = alt.Chart(df).mark_bar().encode(
            x=alt.X(cat_col, type='nominal'),
            y=alt.Y(num_col, type='quantitative')
        )
    else:
        chart = alt.Chart(df).mark_point().encode(
            x=alt.X(df.columns[0], type='quantitative'),
            y=alt.Y(df.columns[1], type='quantitative')
        )
    return chart.to_json(format = "vega")
