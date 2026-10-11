
import { createTelnyxVoipClient } from '@telnyx/react-voice-commons-sdk';

const telnyxClient = createTelnyxVoipClient({
  debug: __DEV__,
});

export { telnyxClient };
export default telnyxClient;
