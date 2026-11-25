import TopBar from './TopBar';
import { teacherLogout } from '@/app/actions';

const NAV = [
  ['/teacher', 'Dashboard'],
  ['/teacher/lessons', 'Хичээл ба слайд'],
  ['/teacher/setup', 'Анги ба сурагч'],
];

export default function TeacherBar({ active }) {
  return (
    <TopBar nav={NAV} active={active}>
      <form action={teacherLogout}>
        <button className="btn ghost sm">Гарах</button>
      </form>
    </TopBar>
  );
}
