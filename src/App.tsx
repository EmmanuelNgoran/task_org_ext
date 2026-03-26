import './index.css';
import { TaskList } from './components/TaskList';

function App() {
  return (
    <div className="w-[380px] h-[560px] font-sans bg-gray-50 flex flex-col overflow-hidden">
      <TaskList />
    </div>
  );
}

export default App;
