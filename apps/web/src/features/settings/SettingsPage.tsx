import { Button, Card, Space, Typography } from '@douyinfe/semi-ui';
import { IconSetting, IconBolt } from '@douyinfe/semi-icons';
import { LlmProviderSettings } from '../llm-provider/LlmProviderSettings';

const { Title, Text, Paragraph } = Typography;

type SettingsSection = 'llm-provider';

interface SettingsPageProps {
  section?: SettingsSection;
}

export function SettingsPage({ section = 'llm-provider' }: SettingsPageProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: 16 }}>
      <Card style={{ borderRadius: 12, minHeight: 'calc(100vh - 84px)' }} bodyStyle={{ padding: 16 }}>
        <Space spacing={8} style={{ marginBottom: 18 }}>
          <IconSetting />
          <Title heading={5} style={{ margin: 0 }}>设置</Title>
        </Space>
        <Space vertical align="start" spacing={6} style={{ width: '100%' }}>
          <Button
            icon={<IconBolt />}
            theme={section === 'llm-provider' ? 'light' : 'borderless'}
            type={section === 'llm-provider' ? 'primary' : 'tertiary'}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            模型接入
          </Button>
        </Space>
        <Paragraph type="tertiary" style={{ marginTop: 16 }}>
          这里管理工作台级能力。第一版先开放 Magpie 模型接入。
        </Paragraph>
      </Card>

      <main>
        <div style={{ marginBottom: 16 }}>
          <Title heading={3} style={{ margin: 0 }}>模型接入</Title>
          <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>
            配置创作工作台调用模型的方式。第一版只支持 Magpie 本地网关。
          </Text>
        </div>
        <LlmProviderSettings />
      </main>
    </div>
  );
}
