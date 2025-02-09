import { useState, useEffect } from 'react'
import axios from 'axios'
import { AiOutlineSend } from 'react-icons/ai'
import './App.css'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export default function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [bgColor, setBgColor] = useState('#dfe3e6') 
  
  useEffect(() => {
    const savedQuestion = localStorage.getItem('savedQuestion')
    if (savedQuestion) {
      setQuestion(savedQuestion)
    } else {
      fetchQuestion()
    }
  }, [])

  const getBackgroundColor = (responseText: string) => {
    const lower = responseText.toLowerCase()
    if (lower.includes('неправильный')) return '#FFCDD2' 
    if (lower.includes('частично правильный')) return '#FFF59D' 
    if (lower.includes('правильный')) return '#C8E6C9' 
    return '#dfe3e6' 
  }

  const fetchQuestion = async () => {
    setLoading(true)
    try {
      const res = await axios.post<OpenAIResponse>(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'Ты опытный интервьюер по фронтенду. Генерируй только вопрос, без дополнительных слов, пояснений и приветствий. Категории вопросов: JavaScript, React, оптимизация, асинхронность, HTTP, браузерные API.',
            },
            { role: 'user', content: 'Сгенерируй один случайный вопрос для собеседования.' },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      )

      let newQuestion = res.data.choices[0]?.message?.content ?? ''
      newQuestion = newQuestion.replace(/^.*?:\s*/, '').trim()

      setQuestion(newQuestion)
      localStorage.setItem('savedQuestion', newQuestion) 
      setFeedback('')
      setAnswer('')
      setBgColor('#dfe3e6')
    } catch (error) {
      console.error('Ошибка при получении вопроса:', error)
      setQuestion('Ошибка при загрузке вопроса. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  // Проверка ответа
  const checkAnswer = async () => {
    if (!question) {
      alert('Сначала получите вопрос!')
      return
    }
    if (!answer.trim()) {
      alert('Введите ответ!')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post<OpenAIResponse>(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                "Оцени ответ как 'правильный', 'частично правильный' или 'неправильный' и дай краткое объяснение. Будь менее строгим к формулировкам, если суть ответа верная. Не переформулируй ответ, а просто оцени его. Если ответ пользователя в целом передает правильную суть, считай его 'правильным'. Игнорируй незначительные расхождения в формулировках.",
            },
            { role: 'user', content: `Вопрос: ${question}\nОтвет: ${answer}` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
        }
      )
      const responseText = res.data.choices[0]?.message?.content ?? ''
      setFeedback(responseText)
      setBgColor(getBackgroundColor(responseText))
    } catch (error) {
      console.error('Ошибка при проверке ответа:', error)
      setFeedback('Ошибка при проверке ответа. Попробуйте снова.')
      setBgColor('#FFCDD2')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container' style={{ backgroundColor: bgColor }}>
      <button className='next-question' onClick={fetchQuestion} disabled={loading}>
        ➜
      </button>

      {question && <h1 className='question'>{question}</h1>}

      <div className='input-container'>
        <input
          type='text'
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className='input'
          placeholder='Введите ваш ответ...'
          disabled={loading}
        />
        <button onClick={checkAnswer} className='send-btn' disabled={loading}>
          <AiOutlineSend />
        </button>
      </div>

      {feedback && <p className='feedback'>{feedback}</p>}
    </div>
  )
}
