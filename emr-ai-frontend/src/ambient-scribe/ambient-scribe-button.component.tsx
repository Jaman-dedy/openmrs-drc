import React, { useState } from 'react';
import { Button, ComposedModal, ModalHeader, ModalBody } from '@carbon/react';
import { Microphone } from '@carbon/react/icons';
import AmbientScribeWorkspace from './ambient-scribe-workspace.component';

const AmbientScribeButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const patientUuid = window.location.pathname.match(/\/patient\/([^/]+)/)?.[1] ?? '';

  return (
    <>
      <Button kind="ghost" size="sm" renderIcon={Microphone} onClick={() => setIsOpen(true)}>
        Ambient Scribe
      </Button>
      {isOpen && (
        <ComposedModal open size="lg" onClose={() => setIsOpen(false)}>
          <ModalHeader title="Ambient Scribe" />
          <ModalBody>
            <AmbientScribeWorkspace patientUuid={patientUuid} closeWorkspace={() => setIsOpen(false)} />
          </ModalBody>
        </ComposedModal>
      )}
    </>
  );
};

export default AmbientScribeButton;
