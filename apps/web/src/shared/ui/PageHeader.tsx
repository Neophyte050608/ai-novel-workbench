import { Typography } from '@douyinfe/semi-ui';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <section
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '20px 24px',
        background: 'var(--semi-color-bg-0)',
        border: '1px solid var(--semi-color-border)',
        borderRadius: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <Title heading={3} style={{ margin: 0, lineHeight: '32px' }}>
          {title}
        </Title>
        {description ? (
          <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>
            {description}
          </Text>
        ) : null}
      </div>
      {actions ? <div style={{ flex: '0 0 auto' }}>{actions}</div> : null}
    </section>
  );
}
