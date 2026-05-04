import { defineConfigSchema, getSyncLifecycle, registerExtension } from '@openmrs/esm-framework';
import AmbientScribeButton from './ambient-scribe/ambient-scribe-button.component';
import AmbientScribeWorkspace from './ambient-scribe/ambient-scribe-workspace.component';
import { moduleName } from './constants';

const options = {
  featureName: 'ambient-scribe',
  moduleName,
};

export function startupApp() {
  defineConfigSchema(moduleName, {});

  registerExtension({
    name: 'ambient-scribe-button',
    load: getSyncLifecycle(AmbientScribeButton, options),
    meta: {},
  });
}

export const ambientScribeButton = getSyncLifecycle(AmbientScribeButton, options);
export const ambientScribeWorkspace = getSyncLifecycle(AmbientScribeWorkspace, options);
