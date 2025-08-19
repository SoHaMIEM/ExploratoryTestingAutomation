from openai import OpenAI

try:
    client = OpenAI(
        api_key='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', 
        base_url='https://api.perplexity.ai'
    )
    print('✅ Client created successfully')
    
    response = client.chat.completions.create(
        model='sonar-pro', 
        messages=[{'role': 'user', 'content': 'Say hello in one word'}], 
        max_tokens=10
    )
    print('✅ API call successful:', response.choices[0].message.content)
except Exception as e:
    print('❌ Error:', str(e))
