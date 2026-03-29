import './index.css';
import { TaskList } from './components/TaskList';

function App() {
  return (
    <div className="w-[380px] h-[560px] font-sans bg-white flex flex-col overflow-hidden border border-black">
      <TaskList />
    </div>
  );
}

export default App;
