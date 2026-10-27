import { AuthLayout, Footer } from '@inno-trec/ui-web';
import euEmblem from '@inno-trec/ui-web/assets/funding/eu-funded-negative.png';
import logo from '@inno-trec/ui-web/assets/logos/logo-landscape-colour.png';
import type { ReactNode } from 'react';
import { FOOTER_LINKS, TOOL_NAME } from '../config';

/**
 * The frame of every screen without a session (sign in, create an account, accept an invitation, reset a
 * password): the same top bar and footer as the tool, and one centered panel with one task.
 */
export function SignedOutFrame({ heading, intro, aside, children }: { heading: ReactNode; intro?: ReactNode; aside?: ReactNode; children?: ReactNode }) {
  return (
    <AuthLayout logoSrc={logo} title={TOOL_NAME} heading={heading} intro={intro} aside={aside} footer={<Footer emblemSrc={euEmblem} links={FOOTER_LINKS} />}>
      {children}
    </AuthLayout>
  );
}
