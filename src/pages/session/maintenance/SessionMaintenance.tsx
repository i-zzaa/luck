// src/components/session/maintenance/SessionMaintenance.tsx
import React from 'react';
import { SessionMaintenanceManual } from './SessionMaintenanceManual';
import { SessionMaintenancePortage } from './SessionMaintenancePortage';
import { SessionMaintenanceVBMapp } from './SessionMaintenanceVBMapp';


type MaintenanceNode = any;
type MaintenanceArr = MaintenanceNode[];

export type MaintenanceObj = {
  manual?: MaintenanceArr;
  vbmapp?: MaintenanceArr;
  portage?: MaintenanceArr;
};

interface Props {
  listMaintenance: MaintenanceObj; // { manual, vbmapp, portage } já transformado com slots
  isEdit: boolean;
  setListMaintenance: (
    next:
      | MaintenanceObj
      | ((prev: MaintenanceObj) => MaintenanceObj)
  ) => void;
}

export const SessionMaintenance: React.FC<Props> = ({
  listMaintenance,
  isEdit,
  setListMaintenance,
}) => {
  const setManual = (updater: (prev: MaintenanceArr) => MaintenanceArr) =>
    setListMaintenance(prev => ({
      ...prev,
      manual: updater(prev?.manual || []),
    }));

  const setPortage = (updater: (prev: MaintenanceArr) => MaintenanceArr) =>
    setListMaintenance(prev => ({
      ...prev,
      portage: updater(prev?.portage || []),
    }));

  const setVBMapp = (updater: (prev: MaintenanceArr) => MaintenanceArr) =>
    setListMaintenance(prev => ({
      ...prev,
      vbmapp: updater(prev?.vbmapp || []),
    }));

  const hasAny =
    (Array.isArray(listMaintenance?.manual) && listMaintenance.manual!.length > 0) ||
    (Array.isArray(listMaintenance?.portage) && listMaintenance.portage!.length > 0) ||
    (Array.isArray(listMaintenance?.vbmapp) && listMaintenance.vbmapp!.length > 0);

  if (!hasAny) return null;

  return (
    <>
      <SessionMaintenanceManual
        data={listMaintenance?.manual || []}
        isEdit={isEdit}
        setCategory={setManual}
      />

      <SessionMaintenanceVBMapp
        data={listMaintenance?.vbmapp || []}
        isEdit={isEdit}
        setCategory={setVBMapp}
      />

      <SessionMaintenancePortage
        data={listMaintenance?.portage || []}
        isEdit={isEdit}
        setCategory={setPortage}
      />
    </>
  );
};
