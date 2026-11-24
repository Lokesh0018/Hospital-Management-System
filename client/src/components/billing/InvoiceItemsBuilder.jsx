import React from 'react';
import { Plus, Trash2, Tag, Sparkles } from 'lucide-react';

const ITEM_TYPES = [
  { label: 'Consultation', value: 'CONSULTATION' },
  { label: 'Lab Test', value: 'LAB_TEST' },
  { label: 'Medication', value: 'MEDICATION' },
  { label: 'Procedure', value: 'PROCEDURE' },
  { label: 'Room Charge', value: 'ROOM_CHARGE' },
  { label: 'Other', value: 'OTHER' }
];

const TEMPLATES = [
  { itemType: 'CONSULTATION', description: 'Specialist Physician Consultation', quantity: 1, unitPrice: 150 },
  { itemType: 'LAB_TEST', description: 'Comprehensive Blood Count (CBC) Panel', quantity: 1, unitPrice: 45 },
  { itemType: 'PROCEDURE', description: '12-Lead Electrocardiogram (ECG)', quantity: 1, unitPrice: 75 },
  { itemType: 'LAB_TEST', description: 'Magnetic Resonance Imaging (MRI) Scan', quantity: 1, unitPrice: 650 },
  { itemType: 'MEDICATION', description: 'Prescription Antibiotic Course (Oral)', quantity: 1, unitPrice: 35 },
  { itemType: 'ROOM_CHARGE', description: 'General Ward Inpatient Care (1 Day)', quantity: 1, unitPrice: 200 }
];

export const InvoiceItemsBuilder = ({ items = [], onChange }) => {
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  const handleAddRow = () => {
    onChange([
      ...items,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        itemType: 'CONSULTATION',
        description: '',
        quantity: 1,
        unitPrice: 0
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleApplyTemplate = (tmpl) => {
    onChange([
      ...items,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        itemType: tmpl.itemType,
        description: tmpl.description,
        quantity: tmpl.quantity,
        unitPrice: tmpl.unitPrice
      }
    ]);
  };

  return (
    <div className="line-items-builder">
      {/* Quick Templates Row */}
      <div className="template-chips-row" style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
          <Sparkles size={14} color="#0284c7" />
          <span>Quick Add Template:</span>
        </div>
        {TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            className="template-chip"
            onClick={() => handleApplyTemplate(tmpl)}
          >
            + {tmpl.description.split('(')[0].trim()} (${tmpl.unitPrice})
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <table className="builder-table">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ width: '22%' }}>Category</th>
              <th style={{ width: '38%' }}>Description / Service</th>
              <th style={{ width: '12%' }}>Qty</th>
              <th style={{ width: '14%' }}>Unit Price ($)</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Total ($)</th>
              <th style={{ width: '4%' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = parseInt(item.quantity, 10) || 0;
              const unit = parseFloat(item.unitPrice) || 0;
              const lineTotal = (qty * unit).toFixed(2);

              return (
                <tr key={item.id || idx}>
                  <td>
                    <select
                      className="form-control form-control-sm"
                      value={item.itemType}
                      onChange={(e) => handleItemChange(idx, 'itemType', e.target.value)}
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Diagnostic Consultation / Lab Panel"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="form-control form-control-sm"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control form-control-sm"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      required
                    />
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle', fontWeight: 600, color: '#0f172a' }}>
                    ${lineTotal}
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      type="button"
                      className="btn-remove-row"
                      onClick={() => handleRemoveRow(idx)}
                      disabled={items.length <= 1}
                      title="Remove Item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <div className="add-row-bar">
        <button
          id="btn-add-line-item"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAddRow}
        >
          <Plus size={14} />
          <span>Add Line Item</span>
        </button>
      </div>
    </div>
  );
};

export default InvoiceItemsBuilder;
