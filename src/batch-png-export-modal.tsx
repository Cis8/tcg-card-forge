import React, { useState } from 'react';
import { Glyph } from './glyphs';
import type { BatchPngExportState, BatchPngExportOptions } from './hooks/useBatchPngExport';

interface BatchPngExportModalProps {
  open: boolean;
  cardCount: number;
  state: BatchPngExportState;
  onStart: (options: BatchPngExportOptions) => void;
  onCancel: () => void;
  onClose: () => void;
}

export function BatchPngExportModal({
  open, cardCount, state, onStart, onCancel, onClose,
}: BatchPngExportModalProps): React.ReactElement | null {
  const [sortByFaction, setSortByFaction] = useState(false);
  const [sortByCost, setSortByCost] = useState(false);

  if (!open) return null;

  const isRunning = state.kind === 'rendering' || state.kind === 'zipping';

  const progressPct =
    state.kind === 'rendering' ? Math.round(((state.index + 1) / state.total) * 100) :
    state.kind === 'zipping'   ? 100 : 0;

  const handleScrimClick = () => { if (!isRunning) onClose(); };

  return (
    <div className="modal-scrim batch-png-scrim" onClick={handleScrimClick}>
      <div className="modal export-modal batch-png-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-eyebrow">Export</span>
            <h2 className="modal-title">Export All PNGs</h2>
          </div>
          {!isRunning && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Glyph name="close" size={16}/>
            </button>
          )}
        </header>

        <div className="export-modal-body">
          {state.kind === 'idle' && (
            <>
              <p className="export-modal-desc">
                Render all {cardCount} card{cardCount !== 1 ? 's' : ''} as PNG images and
                download them as a ZIP archive.
              </p>

              <div className="batch-png-options">
                <label className="batch-png-option">
                  <input
                    type="checkbox"
                    checked={sortByFaction}
                    onChange={(e) => setSortByFaction(e.target.checked)}
                  />
                  <span>Group into subfolders by faction</span>
                </label>
                <label className="batch-png-option">
                  <input
                    type="checkbox"
                    checked={sortByCost}
                    onChange={(e) => setSortByCost(e.target.checked)}
                  />
                  <span>Group into subfolders by cost <span className="export-modal-btn-hint">(10+ for cost ≥ 10)</span></span>
                </label>
              </div>

              <div className="export-modal-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onStart({ sortByFaction, sortByCost })}
                >
                  <Glyph name="download" size={14}/>
                  Export {cardCount} card{cardCount !== 1 ? 's' : ''}
                </button>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          )}

          {isRunning && (
            <div className="batch-png-progress">
              <p className="export-modal-desc">
                {state.kind === 'rendering'
                  ? `Rendering card ${state.index + 1} of ${state.total}…`
                  : 'Building ZIP archive…'}
              </p>
              <div className="batch-png-bar-track" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="batch-png-bar-fill" style={{ width: `${progressPct}%` }}/>
              </div>
              <span className="batch-png-pct">{progressPct}%</span>
              <button type="button" className="btn btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            </div>
          )}

          {state.kind === 'done' && (
            <div className="batch-png-result">
              <p className="export-modal-desc">
                Exported {state.count} card{state.count !== 1 ? 's' : ''} — check your downloads folder.
              </p>
              <div className="export-modal-actions">
                <button type="button" className="btn btn-primary" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          )}

          {state.kind === 'error' && (
            <div className="batch-png-result">
              <p className="export-modal-desc batch-png-error">
                Export failed: {state.message}
              </p>
              <div className="export-modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
