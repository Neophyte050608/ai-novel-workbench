import { Button, Layout, Typography } from '@douyinfe/semi-ui';
import { IconBook, IconSetting } from '@douyinfe/semi-icons';
import { useEffect, useState } from 'react';
import { ProjectList } from '../features/projects/ProjectList';
import { SettingsPage } from '../features/settings/SettingsPage';
import { t } from '../shared/i18n';
import { readInitialNovelLocation, resetToSettings, updateNovelLocation } from '../shared/navigation/workspaceLocation';

const { Header, Content } = Layout;
const { Text } = Typography;
type AppView = 'shelf' | 'settings';

export function App() {
  const [view, setView] = useState<AppView>(() => readInitialNovelLocation().app === 'settings' ? 'settings' : 'shelf');
  const [skipLinkFocused, setSkipLinkFocused] = useState(false);

  useEffect(() => {
    if (view === 'settings') resetToSettings();
    else updateNovelLocation({ app: 'shelf' });
  }, [view]);

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--semi-color-fill-0)' }}>
      <a
        href="#app-main-content"
        onFocus={() => setSkipLinkFocused(true)}
        onBlur={() => setSkipLinkFocused(false)}
        style={{
          position: 'absolute',
          left: 12,
          top: skipLinkFocused ? 8 : -48,
          zIndex: 1000,
          padding: '8px 12px',
          borderRadius: 8,
          background: 'var(--semi-color-bg-0)',
          color: 'var(--semi-color-primary)',
          boxShadow: 'var(--semi-shadow-elevated)',
        }}
      >
        跳到主内容
      </a>
      <Header
        style={{
          height: 52,
          padding: '0 16px',
          background: 'var(--semi-color-bg-0)',
          borderBottom: '1px solid var(--semi-color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={() => setView('shelf')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: 0,
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--semi-color-text-0)',
          }}
        >
          <IconBook />
          <Text strong>{t('app.name')}</Text>
        </button>
        <Button
          icon={<IconSetting />}
          theme={view === 'settings' ? 'light' : 'borderless'}
          aria-label={t('actions.settings')}
          onClick={() => setView((current) => (current === 'settings' ? 'shelf' : 'settings'))}
        >
          {t('actions.settings')}
        </Button>
      </Header>
      <Content style={{ padding: 16 }}>
        <main id="app-main-content" role="main" tabIndex={-1}>
          {view === 'settings' ? <SettingsPage /> : <ProjectList />}
        </main>
      </Content>
    </Layout>
  );
}
