import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { apiAdminCreateUser, User } from '../../api';
import { AField, AInput, ASelect, AChipMulti, AdminCreateModalShell } from './primitives';
import { DEPT_ORDER } from '../../lib/depts';
import { useConfirm } from '../ConfirmDialog';

const DEPT_OPTIONS = DEPT_ORDER;
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Treballador/a',       label: 'Treballador/a' },
  { value: 'Cap de departament',  label: 'Cap de departament' },
  { value: 'Administrador',       label: 'Administrador' },
  { value: 'Formacions',          label: 'Formacions' },
  { value: 'Comunicacions',       label: 'Comunicacions' },
  { value: 'SolicitudsDissabtes', label: 'Sol·licituds dissabtes' },
  { value: 'SolicitudsVacances',  label: 'Sol·licituds vacances (RRHH)' },
];

export function CreateUserModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: User) => void;
}) {
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [dept, setDept] = useState(DEPT_OPTIONS[0]);
  const [roles, setRoles] = useState<string[]>(['Treballador/a']);
  const [tempPass, setTempPass] = useState('');
  const [passTouched, setPassTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm, confirmNode } = useConfirm();

  useEffect(() => {
    if (open) {
      setName(''); setNameTouched(false); setEmail(''); setEmailTouched(false);
      setDept(DEPT_OPTIONS[0]); setRoles(['Treballador/a']);
      setTempPass(''); setPassTouched(false);
      setError(null); setSaving(false);
    }
  }, [open]);

  const isDirty = name.trim() !== '' || email.trim() !== '' || tempPass.trim() !== '';
  const nameError = nameTouched && !name.trim();
  const emailError = emailTouched && (!email.trim() || !email.includes('@'));
  const passError = passTouched && tempPass.trim().length < 8 && tempPass.trim().length > 0;

  const handleClose = async () => {
    if (!isDirty) { onClose(); return; }
    const ok = await confirm({ title: 'Descartar canvis?', message: 'Hi ha dades al formulari que es perdran.', confirmLabel: 'Sí, descarta', cancelLabel: 'Torna al formulari', destructive: true });
    if (ok) onClose();
  };

  const submit = async () => {
    setNameTouched(true); setEmailTouched(true); setPassTouched(true);
    if (!name.trim()) { setError('Cal indicar el nom complet.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Cal un correu corporatiu vàlid.'); return; }
    if (tempPass.trim().length < 8) { setError('La contrasenya temporal ha de tenir mínim 8 caràcters.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiAdminCreateUser({
        name: name.trim(), email: email.trim(), temp_password: tempPass.trim(), roles, dept,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant usuari');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminCreateModalShell
        open={open} onClose={handleClose} onSubmit={submit}
        title="Crea un compte al portal" kicker="NOU USUARI"
        saveLabel="Crea usuari" savingLabel="Creant…"
        saving={saving} error={error}
      >
        <AField label="Nom complet" required error={nameError ? 'El nom és obligatori.' : undefined}>
          <AInput value={name} onChange={e => setName(e.target.value)} onBlur={() => setNameTouched(true)} placeholder="Nom i cognoms" hasError={nameError} />
        </AField>
        <AField label="Correu corporatiu" required hint="Serà l'identificador d'accés al portal." error={emailError ? 'Introdueix un correu vàlid.' : undefined}>
          <AInput value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} type="email" placeholder="nom.cognom@tavil.net" icon={Mail} hasError={emailError} />
        </AField>
        <AField label="Departament">
          <ASelect value={dept} onChange={e => setDept(e.target.value)} options={DEPT_OPTIONS} />
        </AField>
        <AField label="Rols del portal" hint="Multiassignable. Cap de departament = aprova vacances del seu dept.">
          <AChipMulti value={roles} onChange={setRoles} options={ROLE_OPTIONS} />
        </AField>
        <AField label="Contrasenya temporal" required hint="Mínim 8 caràcters. L'usuari l'haurà de canviar al primer accés." error={passError ? 'Mínim 8 caràcters.' : undefined}>
          <AInput value={tempPass} onChange={e => setTempPass(e.target.value)} onBlur={() => setPassTouched(true)} type="text" placeholder="Escriu una contrasenya inicial" autoComplete="new-password" hasError={passError} />
        </AField>
      </AdminCreateModalShell>
      {confirmNode}
    </>
  );
}
