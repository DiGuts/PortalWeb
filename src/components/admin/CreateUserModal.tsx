import React, { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import { apiAdminCreateUser, User } from '../../api';
import { AField, AInput, ASelect, AChipMulti, AdminCreateModalShell } from './primitives';
import { DEPT_ORDER } from '../../lib/depts';

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
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState(DEPT_OPTIONS[0]);
  const [roles, setRoles] = useState<string[]>(['Treballador/a']);
  const [tempPass, setTempPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(''); setEmail(''); setDept(DEPT_OPTIONS[0]); setRoles(['Treballador/a']);
      setTempPass(''); setError(null); setSaving(false);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) { setError('Cal indicar el nom complet.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Cal un correu corporatiu vàlid.'); return; }
    if (tempPass.trim().length < 8) { setError('La contrasenya temporal ha de tenir mínim 8 caràcters.'); return; }
    setError(null); setSaving(true);
    try {
      const created = await apiAdminCreateUser({
        name: name.trim(), email: email.trim(), temp_password: tempPass.trim(),
        roles, dept,
      });
      onCreated(created);
    } catch (e: any) {
      setError(e?.message ?? 'Error creant usuari');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCreateModalShell
      open={open} onClose={onClose} onSubmit={submit}
      title="Crea un compte al portal" kicker="NOU USUARI"
      saveLabel="Crea usuari" savingLabel="Creant…"
      saving={saving} error={error}
      footerNote={<>S'envia un email amb les credencials? <strong style={{ color: 'var(--tavil-muted)' }}>Manual</strong></>}
    >
      <AField label="Nom complet">
        <AInput value={name} onChange={e => setName(e.target.value)} placeholder="Nom i cognoms" />
      </AField>
      <AField label="Correu corporatiu" hint="Serà l'identificador d'accés al portal.">
        <AInput value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="nom.cognom@tavil.net" icon={Mail} />
      </AField>
      <AField label="Departament">
        <ASelect value={dept} onChange={e => setDept(e.target.value)} options={DEPT_OPTIONS} />
      </AField>
      <AField label="Rols del portal" hint="Multiassignable. Cap de departament = aprova vacances del seu dept.">
        <AChipMulti value={roles} onChange={setRoles} options={ROLE_OPTIONS} />
      </AField>
      <AField label="Contrasenya temporal" hint="Mínim 8 caràcters. L'usuari l'haurà de canviar al primer accés.">
        <AInput value={tempPass} onChange={e => setTempPass(e.target.value)} type="text" placeholder="Escriu una contrasenya inicial" autoComplete="new-password" />
      </AField>
    </AdminCreateModalShell>
  );
}
