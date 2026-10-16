import { useAppFlow } from './presentation/hooks/useAppFlow'
import ConfigPage from './presentation/pages/ConfigPage'
import ExamPage from './presentation/pages/ExamPage'
import ResultsPlaceholderPage from './presentation/pages/ResultsPlaceholderPage'

function App() {
  const { state, examStarted, examSubmitted, backToConfig } = useAppFlow()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {state.screen === 'config' && <ConfigPage onExamStarted={examStarted} />}
      {state.screen === 'exam' && state.exam && (
        <ExamPage
          key={state.exam.id}
          exam={state.exam}
          onSubmitted={examSubmitted}
          onExit={backToConfig}
        />
      )}
      {state.screen === 'results' && state.outcome && (
        <ResultsPlaceholderPage outcome={state.outcome} onNewExam={backToConfig} />
      )}
    </div>
  )
}

export default App
