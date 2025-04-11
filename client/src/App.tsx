import { useState } from 'react'
import axios from 'axios'

export function App() {
  const [text, setText] = useState('')
  const [hits, setHits] = useState<null|Boolean>(null);
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false) // Loading state to track the request progress

  const handleSubmit = async () => {
    setLoading(true) // Set loading to true when the request starts
    try {
      const res = await axios.post('https://localhost:3001/api/submit', { text })
      console.log(res.data)

      // Assuming res.data.hits.hits is the array to map over
      const formattedResponse = res.data.hits.hits.map((x:any, index:number) => {
        const { id, location, name, total } = x._source
        return (
          <li key={id}>
            ({id}) {name} - Total: {total} - Location: {location}
          </li>
        )
      })
      if (res.data.hits.hits.length) setHits(true);
      else setHits(false);
      setResponse(formattedResponse) // Set the formatted response
    } catch (err) {
      setResponse('Error sending data.')
    } finally {
      setLoading(false) // Set loading to false once the request is done
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <input
        type="text"
        className="border border-gray-400 px-4 py-2 rounded w-full max-w-md"
        placeholder="Enter something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={handleSubmit}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={loading} // Disable button when loading
      >
        {loading ? 'Loading...' : 'Submit'} {/* Show loading text when loading */}
      </button>

      {response && (
        <div className="mt-4">
          {Array.isArray(response) ? (
            <ol className="list-decimal pl-5">
              {response}
            </ol>
          ) : (
            <p className="text-green-600">{response}</p>
          )}
        </div>
      )}
      {hits === false && (
        <p className='text-red-600'>Not Found</p>
      )}
    </div>
  )
}
