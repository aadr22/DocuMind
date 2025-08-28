'use client'

import React from 'react'

interface LoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'white'
  text?: string
}

export default function LoadingAnimation({ 
  size = 'md', 
  color = 'blue',
  text = 'Processing...'
}: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    white: 'bg-white'
  }

  const containerSize = {
    sm: 'space-x-1',
    md: 'space-x-2',
    lg: 'space-x-3'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Animated Dots */}
      <div className={`flex items-center ${containerSize[size]}`}>
        <div 
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{ animationDelay: '0ms' }}
        />
        <div 
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{ animationDelay: '150ms' }}
        />
        <div 
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{ animationDelay: '300ms' }}
        />
      </div>
      
      {/* Loading Text */}
      {text && (
        <div className="text-center">
          <p className={`text-${color === 'white' ? 'white' : 'gray'} font-medium ${
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
          }`}>
            {text}
          </p>
        </div>
      )}
    </div>
  )
}

// Specialized loading components for common use cases
export function DocumentProcessingLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-pulse" />
        {/* Inner ring */}
        <div className="absolute top-2 left-2 w-12 h-12 border-4 border-blue-500 rounded-full animate-spin" />
        {/* Center icon */}
        <div className="absolute top-4 left-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Document</h3>
        <p className="text-gray-600">Please wait while we analyze your file...</p>
      </div>
      
      {/* Progress dots */}
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
}

export function AIProcessingLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative">
        {/* Brain icon with pulse effect */}
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 translate-y-1/2" />
          <div className="absolute left-0 top-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute right-0 top-1/2 w-2 h-2 bg-cyan-500 rounded-full transform -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
        <p className="text-gray-600">Our AI is analyzing your document...</p>
      </div>
      
      {/* Neural network animation */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-1">
            {[...Array(3)].map((_, j) => (
              <div 
                key={j} 
                className="w-1 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                style={{ animationDelay: `${(i + j) * 100}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
