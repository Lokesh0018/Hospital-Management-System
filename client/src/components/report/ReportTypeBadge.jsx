import React from 'react';
import {
  FileText,
  Activity,
  Zap,
  Layers,
  HeartPulse,
  Folder
} from 'lucide-react';

const TYPE_MAPPING = {
  'BLOOD TEST': { label: 'Blood Test', icon: Activity, classModifier: 'type-blood-test' },
  'BLOOD_TEST': { label: 'Blood Test', icon: Activity, classModifier: 'type-blood-test' },
  'X-RAY': { label: 'X-Ray', icon: Zap, classModifier: 'type-x-ray' },
  'X_RAY': { label: 'X-Ray', icon: Zap, classModifier: 'type-x-ray' },
  'MRI': { label: 'MRI Scan', icon: Layers, classModifier: 'type-mri' },
  'CT SCAN': { label: 'CT Scan', icon: Layers, classModifier: 'type-ct-scan' },
  'CT_SCAN': { label: 'CT Scan', icon: Layers, classModifier: 'type-ct-scan' },
  'ECG': { label: 'ECG', icon: HeartPulse, classModifier: 'type-ecg' },
  'OTHER': { label: 'Diagnostic Test', icon: FileText, classModifier: 'type-other' }
};

export const ReportTypeBadge = ({ type }) => {
  const normKey = (type || 'OTHER').toUpperCase();
  const config = TYPE_MAPPING[normKey] || TYPE_MAPPING['OTHER'];
  const Icon = config.icon;

  return (
    <span className={`badge-report-type ${config.classModifier}`}>
      <Icon size={12} />
      <span>{config.label}</span>
    </span>
  );
};

export default ReportTypeBadge;
