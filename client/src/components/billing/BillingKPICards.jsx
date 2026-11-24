import React from 'react';
import { DollarSign, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export const BillingKPICards = ({ stats }) => {
  const financials = stats?.financials || {};
  const counts = stats?.invoiceCounts || {};

  const totalBilled = financials.totalBilled || 0;
  const totalCollected = financials.totalCollected || 0;
  const totalOutstanding = financials.totalOutstanding || 0;
  const collectionRate = financials.collectionRate || 0;

  return (
    <div className="billing-kpi-grid">
      {/* Total Invoiced */}
      <div className="billing-kpi-card">
        <div className="kpi-icon-box billed">
          <DollarSign size={24} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Total Invoiced</span>
          <span className="kpi-value">${totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="kpi-subtext">{counts.total || 0} Total Invoices</span>
        </div>
      </div>

      {/* Total Collected */}
      <div className="billing-kpi-card">
        <div className="kpi-icon-box collected">
          <CheckCircle size={24} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Total Collected</span>
          <span className="kpi-value">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="kpi-subtext">{counts.paid || 0} Settled Bills</span>
        </div>
      </div>

      {/* Outstanding Dues */}
      <div className="billing-kpi-card">
        <div className="kpi-icon-box outstanding">
          <AlertCircle size={24} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Outstanding Dues</span>
          <span className="kpi-value amount-due-highlight">${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="kpi-subtext">{(counts.pending || 0) + (counts.partiallyPaid || 0)} Pending / Partial</span>
        </div>
      </div>

      {/* Collection Rate */}
      <div className="billing-kpi-card">
        <div className="kpi-icon-box rate">
          <TrendingUp size={24} />
        </div>
        <div className="kpi-content">
          <span className="kpi-label">Collection Rate</span>
          <span className="kpi-value">{collectionRate}%</span>
          <span className="kpi-subtext">Financial efficiency metric</span>
        </div>
      </div>
    </div>
  );
};

export default BillingKPICards;
