import os
import requests
import json

url = "http://localhost:3001/api/auth/register"
headers = {"Content-Type": "application/json"}
data = {
    "email": "testuser123@example.com",
    "password": "password123"
}

try:
    response = requests.post(url, headers=headers, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Headers: {response.headers}")
except Exception as e:
    print(f"Error: {e}")
