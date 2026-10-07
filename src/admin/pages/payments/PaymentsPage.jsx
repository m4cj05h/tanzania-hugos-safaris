import {h} from '../../../locale';
import React from 'react';
import {ShieldCheck} from 'lucide-react';
import {Empty} from '../../ui';

export default function PaymentsPage(){
  return <Empty icon={ShieldCheck} title="Enquiry mode is active." text="No payment provider is connected. Card, bank, mobile money and crypto transactions are not processed on this website.">
    <p>Connect and verify a payment provider before enabling checkout. Crypto activation additionally requires jurisdiction and provider approval. Payment status must come from verified provider webhooks.</p>
  </Empty>;
}
