import React from 'react';
import { CreditCard, Banknote, Globe, Smartphone, ShieldCheck } from 'lucide-react';

export const PaymentMethodBadge = ({ method }) => {
  const norm = (method || 'CASH').toUpperCase();

  const getIcon = () => {
    switch (norm) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard size={12} />;
      case 'ONLINE':
        return <Globe size={12} />;
      case 'UPI':
        return <Smartphone size={12} />;
      case 'INSURANCE':
        return <ShieldCheck size={12} />;
      case 'CASH':
      default:
        return <Banknote size={12} />;
    }
  };

  const getLabel = () => {
    switch (norm) {
      case 'CREDIT_CARD': return 'Credit Card';
      case 'DEBIT_CARD': return 'Debit Card';
      case 'ONLINE': return 'Online Portal';
      case 'UPI': return 'UPI / QR';
      case 'INSURANCE': return 'Insurance Claim';
      case 'CASH':
      default: return 'Cash';
    }
  };

  return (
    <span className="method-badge">
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};

export default PaymentMethodBadge;
