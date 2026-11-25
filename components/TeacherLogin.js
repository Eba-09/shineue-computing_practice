'use client';

import { useFormState } from 'react-dom';
import { teacherLogin } from '@/app/actions';

export default function TeacherLogin() {
  const [state, action] = useFormState(teacherLogin, null);
  return (
    <form action={action} className="box narrow" style={{ margin: '40px auto 0' }}>
      <p className="eyebrow">Teacher</p>
      <h2 style={{ margin: '4px 0 16px' }}>Багшийн нэвтрэх хэсэг</h2>
      <label className="f">Нууц үг</label>
      <input type="password" name="password" autoFocus style={{ width: '100%' }} />
      {state?.error && <p className="err" style={{ marginTop: 8 }}>{state.error}</p>}
      <div style={{ marginTop: 16 }}>
        <button className="btn">Нэвтрэх</button>
      </div>
    </form>
  );
}
