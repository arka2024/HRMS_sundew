import os, json, requests

api_key = os.getenv('GROQ_API_KEY') or os.environ.get('GROQ_API_KEY')
if not api_key:
    raise RuntimeError('GROQ_API_KEY not set in environment')

url = 'https://api.groq.com/openai/v1/models'
headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get(url, headers=headers)
print(json.dumps(response.json(), indent=2))
