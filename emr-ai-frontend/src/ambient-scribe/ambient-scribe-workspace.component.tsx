import React, { useState, useCallback } from 'react';
import {
  Button,
  InlineNotification,
  InlineLoading,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  TextArea,
  Tag,
} from '@carbon/react';
import { Microphone, StopFilled, Copy, Renew, CheckmarkFilled, Idea, Warning } from '@carbon/react/icons';
import { showSnackbar } from '@openmrs/esm-framework';
import { useAudioRecorder } from './use-audio-recorder.hook';
import { AI_SERVICE_BASE_URL } from '../constants';
import type { SoapNote, RecordingState, CdsSuggestions, CdsState } from '../types';
import styles from './ambient-scribe-workspace.scss';

interface AmbientScribeWorkspaceProps {
  patientUuid: string;
  closeWorkspace: () => void;
}

const AmbientScribeWorkspace: React.FC<AmbientScribeWorkspaceProps> = ({ patientUuid, closeWorkspace }) => {
  const { isRecording, audioBlob, duration, micError, startRecording, stopRecording, reset } = useAudioRecorder();
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const [soap, setSoap] = useState<SoapNote | null>(null);
  const [processError, setProcessError] = useState('');

  const [cdsState, setCdsState] = useState<CdsState>('idle');
  const [cds, setCds] = useState<CdsSuggestions | null>(null);
  const [cdsError, setCdsError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = async () => {
    setProcessError('');
    await startRecording();
    setState('recording');
  };

  const handleStopAndProcess = useCallback(async () => {
    setState('processing');
    const blob = await stopRecording();

    if (!blob || blob.size === 0) {
      setProcessError('No audio was captured. Please try again.');
      setState('error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const response = await fetch(`${AI_SERVICE_BASE_URL}/scribe/process`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(err.detail || `Server error ${response.status}`);
      }

      const result = await response.json();
      setTranscript(result.transcript);
      setSoap(result.soap);
      setState('done');
    } catch (e: any) {
      setProcessError(e.message ?? 'An unexpected error occurred.');
      setState('error');
    }
  }, [stopRecording]);

  const handleGetSuggestions = useCallback(async () => {
    if (!soap) return;
    setCdsState('loading');
    setCdsError('');

    try {
      const response = await fetch(`${AI_SERVICE_BASE_URL}/cds/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(soap),
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(err.detail || `Server error ${response.status}`);
      }

      const result = await response.json();
      setCds(result);
      setCdsState('done');
      setSelectedTab(2); // switch to CDS tab
    } catch (e: any) {
      setCdsError(e.message ?? 'An unexpected error occurred.');
      setCdsState('error');
    }
  }, [soap]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSnackbar({ title: `${label} copied`, kind: 'success', timeoutInMs: 2000 });
    });
  };

  const copyFullNote = () => {
    if (!soap) return;
    const full = [
      `S: ${soap.subjective}`,
      `O: ${soap.objective}`,
      `A: ${soap.assessment}`,
      `P: ${soap.plan}`,
    ].join('\n\n');
    copy(full, 'Full SOAP note');
  };

  const handleReset = () => {
    reset();
    setState('idle');
    setTranscript('');
    setSoap(null);
    setProcessError('');
    setCds(null);
    setCdsState('idle');
    setCdsError('');
    setSelectedTab(0);
  };

  return (
    <div className={styles.workspace}>
      {/* ── Controls ── */}
      <div className={styles.controls}>
        {state === 'idle' && (
          <Button kind="primary" renderIcon={Microphone} onClick={handleStart} size="lg">
            Start Recording
          </Button>
        )}

        {state === 'recording' && (
          <div className={styles.recordingRow}>
            <span className={styles.dot} />
            <span className={styles.timer}>{formatDuration(duration)}</span>
            <Button kind="danger" renderIcon={StopFilled} onClick={handleStopAndProcess} size="lg">
              Stop &amp; Process
            </Button>
          </div>
        )}

        {state === 'processing' && (
          <div className={styles.processingRow}>
            <InlineLoading description="Transcribing and structuring note..." status="active" />
          </div>
        )}

        {(state === 'done' || state === 'error') && (
          <Button kind="ghost" size="sm" renderIcon={Renew} onClick={handleReset}>
            New Recording
          </Button>
        )}
      </div>

      {/* ── Mic permission error ── */}
      {micError && (
        <InlineNotification kind="error" title="Microphone error" subtitle={micError} lowContrast hideCloseButton />
      )}

      {/* ── Process error ── */}
      {state === 'error' && processError && (
        <InlineNotification kind="error" title="Processing failed" subtitle={processError} lowContrast hideCloseButton />
      )}

      {/* ── Results ── */}
      {state === 'done' && soap && (
        <div className={styles.results}>
          <Tabs selectedIndex={selectedTab} onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}>
            <TabList aria-label="Scribe results">
              <Tab>SOAP Note</Tab>
              <Tab>Raw Transcript</Tab>
              <Tab>Clinical Suggestions</Tab>
            </TabList>
            <TabPanels>
              {/* SOAP Tab */}
              <TabPanel>
                <div className={styles.soapContainer}>
                  <SoapField label="S — Subjectif / Subjective" value={soap.subjective} onCopy={() => copy(soap.subjective, 'Subjective')} />
                  <SoapField label="O — Objectif / Objective" value={soap.objective} onCopy={() => copy(soap.objective, 'Objective')} />
                  <SoapField label="A — Analyse / Assessment" value={soap.assessment} onCopy={() => copy(soap.assessment, 'Assessment')} />
                  <SoapField label="P — Plan" value={soap.plan} onCopy={() => copy(soap.plan, 'Plan')} />

                  <div className={styles.copyAllRow}>
                    <Button kind="ghost" renderIcon={CheckmarkFilled} onClick={copyFullNote} size="sm">
                      Copy Full Note
                    </Button>
                    <Button
                      kind="primary"
                      renderIcon={Idea}
                      onClick={handleGetSuggestions}
                      size="sm"
                      disabled={cdsState === 'loading'}
                    >
                      {cdsState === 'loading' ? 'Analyzing...' : 'Get Clinical Suggestions'}
                    </Button>
                  </div>

                  {cdsState === 'loading' && (
                    <InlineLoading description="Generating clinical suggestions..." status="active" />
                  )}
                  {cdsState === 'error' && cdsError && (
                    <InlineNotification kind="error" title="CDS failed" subtitle={cdsError} lowContrast hideCloseButton />
                  )}
                </div>
              </TabPanel>

              {/* Transcript Tab */}
              <TabPanel>
                <TextArea labelText="Raw Transcript" value={transcript} readOnly rows={12} />
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={Copy}
                  onClick={() => copy(transcript, 'Transcript')}
                  className={styles.copyTranscript}
                >
                  Copy Transcript
                </Button>
              </TabPanel>

              {/* CDS Tab */}
              <TabPanel>
                {cdsState === 'idle' && (
                  <div className={styles.cdsPrompt}>
                    <p>Click <strong>Get Clinical Suggestions</strong> on the SOAP Note tab to generate AI-assisted clinical decision support.</p>
                    <Button kind="primary" renderIcon={Idea} onClick={() => { setSelectedTab(0); }}>
                      Go to SOAP Note
                    </Button>
                  </div>
                )}

                {cdsState === 'loading' && (
                  <div className={styles.cdsLoading}>
                    <InlineLoading description="Generating clinical suggestions..." status="active" />
                  </div>
                )}

                {cdsState === 'done' && cds && (
                  <div className={styles.cdsContainer}>
                    {/* Differentials */}
                    <div className={styles.cdsSection}>
                      <h4 className={styles.cdsSectionTitle}>Differential Diagnoses</h4>
                      {cds.differentials.length === 0 ? (
                        <p className={styles.cdsEmpty}>No differentials generated.</p>
                      ) : (
                        cds.differentials.map((d, i) => (
                          <div key={i} className={styles.differential}>
                            <span className={styles.differentialRank}>{i + 1}</span>
                            <div>
                              <p className={styles.differentialName}>{d.diagnosis}</p>
                              <p className={styles.differentialReasoning}>{d.reasoning}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Workup */}
                    <div className={styles.cdsSection}>
                      <h4 className={styles.cdsSectionTitle}>Recommended Workup</h4>
                      {cds.recommended_workup.length === 0 ? (
                        <p className={styles.cdsEmpty}>No workup suggested.</p>
                      ) : (
                        <ul className={styles.workupList}>
                          {cds.recommended_workup.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Treatment Plan */}
                    <div className={styles.cdsSection}>
                      <h4 className={styles.cdsSectionTitle}>Treatment Plan</h4>
                      <p className={styles.treatmentPlan}>
                        {cds.treatment_plan || <em className={styles.cdsEmpty}>No treatment plan generated.</em>}
                      </p>
                    </div>

                    {/* Red Flags */}
                    {cds.red_flags.length > 0 && (
                      <div className={`${styles.cdsSection} ${styles.cdsSectionDanger}`}>
                        <h4 className={`${styles.cdsSectionTitle} ${styles.cdsTitleDanger}`}>
                          <Warning size={16} /> Red Flags
                        </h4>
                        <ul className={styles.redFlagList}>
                          {cds.red_flags.map((flag, i) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className={styles.cdsDisclaimer}>
                      <Tag type="warm-gray" size="sm">AI-generated — always apply clinical judgement</Tag>
                    </div>
                  </div>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      )}
    </div>
  );
};

/* ── Reusable SOAP field ── */
interface SoapFieldProps {
  label: string;
  value: string;
  onCopy: () => void;
}

const SoapField: React.FC<SoapFieldProps> = ({ label, value, onCopy }) => (
  <div className={styles.soapField}>
    <div className={styles.soapFieldHeader}>
      <Tag type="blue" size="sm">{label}</Tag>
      <Button kind="ghost" size="sm" renderIcon={Copy} iconDescription="Copy section" hasIconOnly onClick={onCopy} />
    </div>
    <p className={styles.soapValue}>
      {value ? value : <em className={styles.empty}>Nothing captured for this section</em>}
    </p>
  </div>
);

export default AmbientScribeWorkspace;
