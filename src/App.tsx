import './index.css';
import { TaskList } from './components/TaskList';

function App() {
  return (
    <div
      style={{
        width: 380,
        height: 560,
        fontFamily: 'var(--notion-font)',
        background: 'var(--notion-bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid var(--notion-border)',
      }}
    >
      <TaskList />
    </div>
  );
}

export default App;
