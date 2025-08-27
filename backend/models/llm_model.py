import openai
import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMProcessor:
    def __init__(self):
        """Initialize OpenAI client"""
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        # Configure OpenAI for version 0.28.1
        openai.api_key = api_key
        self.model = "gpt-4o-mini"
    
    def summarize_text(self, text: str, max_length: int = 500) -> str:
        """
        Summarize extracted text using GPT-4o-mini
        
        Args:
            text: Text to summarize
            max_length: Maximum length of summary
            
        Returns:
            Summarized text
        """
        try:
            prompt = f"""
            Please provide a concise summary of the following text in {max_length} characters or less:
            
            {text}
            
            Summary:
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that creates concise, accurate summaries of documents."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_length,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            return summary
            
        except Exception as e:
            print(f"Error in text summarization: {e}")
            return f"Error generating summary: {str(e)}"
    
    def answer_question(self, question: str, context: str, max_length: int = 1000) -> str:
        """
        Answer questions based on extracted text using GPT-4o-mini
        
        Args:
            question: User's question
            context: Extracted text as context
            max_length: Maximum length of answer
            
        Returns:
            AI-generated answer
        """
        try:
            prompt = f"""
            Based on the following document text, please answer the user's question. 
            If the answer cannot be found in the text, please state that clearly.
            
            Document text:
            {context}
            
            Question: {question}
            
            Answer:
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that answers questions based on document content. Be accurate and concise."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_length,
                temperature=0.3
            )
            
            answer = response.choices[0].message.content.strip()
            return answer
            
        except Exception as e:
            print(f"Error in question answering: {e}")
            return f"Error generating answer: {str(e)}"
    
    def analyze_document(self, text: str) -> dict:
        """
        Perform comprehensive document analysis
        
        Args:
            text: Extracted text to analyze
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            prompt = f"""
            Please analyze the following document and provide:
            1. A brief summary (2-3 sentences)
            2. Key topics/themes
            3. Document type (e.g., invoice, contract, report, etc.)
            4. Important dates, numbers, or entities mentioned
            
            Document text:
            {text}
            
            Analysis:
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a document analysis expert. Provide structured, insightful analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                temperature=0.2
            )
            
            analysis = response.choices[0].message.content.strip()
            
            # Parse the analysis into structured format
            return {
                "analysis": analysis,
                "word_count": len(text.split()),
                "char_count": len(text)
            }
            
        except Exception as e:
            print(f"Error in document analysis: {e}")
            return {
                "analysis": f"Error analyzing document: {str(e)}",
                "word_count": len(text.split()),
                "char_count": len(text)
            }
