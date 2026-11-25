import TopBar from './TopBar';
import { studentLogout } from '@/app/actions';

export default function StudentBar({ name, cls }) {
  return (
    <TopBar>
      <span>
        <strong>{name}</strong> · {cls}
      </span>
      <form action={studentLogout}>
        <button className="btn ghost sm">Гарах</button>
      </form>
    </TopBar>
  );
}
