import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Notification, Select, Space, Spin, Tag, Typography } from '@douyinfe/semi-ui';
import {
  createLlmProvider,
  discoverMagpie,
  listLlmProviders,
  listMagpieModels,
  testMagpieConnection,
  testSavedProvider,
  updateLlmProvider,
} from './api';
import type { LlmProvider, MagpieModelItem, TestConnectionResult } from './types';

const { Title, Text, Paragraph } = Typography;
const DEFAULT_BASE_URL = 'http://127.0.0.1:3425/v1';
const DEFAULT_GATEWAY_KEY = 'magpie-ai-novel-workbench';

type ConnectionState = 'idle' | 'detected' | 'failed';

function resultTitle(result: TestConnectionResult) {
  if (result.ok) return `连接成功 · ${result.latencyMs}ms`;
  return result.error?.message || result.message || '连接失败';
}

export function LlmProviderSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);
  const [providers, setProviders] = useState<LlmProvider[]>([]);
  const [models, setModels] = useState<MagpieModelItem[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [detectedVersion, setDetectedVersion] = useState<string>();
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [gatewayKey, setGatewayKey] = useState(DEFAULT_GATEWAY_KEY);
  const [model, setModel] = useState('');
  const [timeoutMs, setTimeoutMs] = useState('30000');
  const [lastTest, setLastTest] = useState<TestConnectionResult>();

  const magpieProvider = useMemo(() => providers.find((provider) => provider.type === 'magpie'), [providers]);
  const isConfigured = Boolean(magpieProvider);

  async function refreshProviders() {
    const data = await listLlmProviders();
    setProviders(data);
    const magpie = data.find((provider) => provider.type === 'magpie');
    if (magpie) {
      setBaseUrl(magpie.baseUrl || DEFAULT_BASE_URL);
      setModel(magpie.model || '');
      setTimeoutMs(String(magpie.config?.timeoutMs ?? 30000));
      setGatewayKey('');
    }
  }

  useEffect(() => {
    refreshProviders()
      .catch((error) => Notification.error({ title: '模型接入加载失败', content: String((error as Error).message ?? error) }))
      .finally(() => setLoading(false));
  }, []);

  async function handleDiscover() {
    setDetecting(true);
    try {
      const result = await discoverMagpie();
      if (result.baseUrl) setBaseUrl(result.baseUrl);
      setDetectedVersion(result.version);
      setConnectionState(result.found ? 'detected' : 'failed');
      if (result.found) {
        Notification.success({ title: '已检测到本机 Magpie' });
      } else {
        Notification.warning({ title: '未检测到本机 Magpie', content: '请确认 Magpie 已启动，或检查本地端口。' });
      }
    } catch (error) {
      setConnectionState('failed');
      Notification.error({ title: '检测失败', content: String((error as Error).message ?? error) });
    } finally {
      setDetecting(false);
    }
  }

  async function handleRefreshModels() {
    setLoadingModels(true);
    try {
      const result = await listMagpieModels({ baseUrl, gatewayKey: gatewayKey || undefined });
      setModels(result.models);
      if (!model && result.models[0]) setModel(result.models[0].id);
      Notification.success({ title: '模型列表已刷新', content: `共 ${result.count} 个模型` });
    } catch (error) {
      Notification.error({ title: '模型列表获取失败', content: String((error as Error).message ?? error) });
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleTest() {
    if (!model) {
      Notification.warning({ title: '请先选择模型' });
      return;
    }
    setTesting(true);
    try {
      const result = magpieProvider && !gatewayKey
        ? await testSavedProvider(magpieProvider.id)
        : await testMagpieConnection({ baseUrl, gatewayKey: gatewayKey || undefined, model });
      setLastTest(result);
      if (result.ok) {
        Notification.success({ title: resultTitle(result) });
      } else {
        Notification.error({ title: '连接失败', content: resultTitle(result) });
      }
    } catch (error) {
      Notification.error({ title: '测试失败', content: String((error as Error).message ?? error) });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!model) {
      Notification.warning({ title: '请先选择模型' });
      return;
    }

    const parsedTimeout = Number(timeoutMs);
    if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
      Notification.warning({ title: 'Timeout 必须是正数' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        baseUrl,
        model,
        gatewayKey: gatewayKey || undefined,
        config: { timeoutMs: parsedTimeout },
        isDefault: true,
        isEnabled: true,
      };
      if (magpieProvider) {
        await updateLlmProvider(magpieProvider.id, payload);
      } else {
        await createLlmProvider(payload);
      }
      Notification.success({ title: 'Magpie 接入已保存' });
      await refreshProviders();
    } catch (error) {
      Notification.error({ title: '保存失败', content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  const statusTag = connectionState === 'detected'
    ? <Tag color="green">已检测{detectedVersion ? ` v${detectedVersion}` : ''}</Tag>
    : connectionState === 'failed'
      ? <Tag color="red">未检测到</Tag>
      : isConfigured
        ? <Tag color="blue">已配置</Tag>
        : <Tag color="grey">未配置</Tag>;

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: 16 }}>
        <Card style={{ borderRadius: 12, minHeight: 'calc(100vh - 84px)' }} bodyStyle={{ padding: 16 }}>
          <Title heading={5} style={{ marginTop: 0 }}>提供商</Title>
          <div
            aria-current="true"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--semi-color-primary)',
              background: 'var(--semi-color-primary-light-default)',
              color: 'var(--semi-color-text-0)',
              boxSizing: 'border-box',
            }}
          >
            <Text strong>Magpie</Text>
            {isConfigured ? <Tag color="green">已启用</Tag> : <Tag>待配置</Tag>}
          </div>
          <Paragraph type="tertiary" style={{ marginTop: 12 }}>
            第一版仅开放 Magpie。其它模型供应商会在后续接入。
          </Paragraph>
        </Card>

        <Card style={{ borderRadius: 12, minHeight: 'calc(100vh - 84px)' }} bodyStyle={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <Space spacing={8}>
                <Title heading={3} style={{ margin: 0 }}>Magpie</Title>
                {statusTag}
              </Space>
              <Paragraph type="secondary" style={{ marginTop: 10, maxWidth: 680 }}>
                通过 Magpie 本地网关使用你已经配置好的模型。模型列表来自 Magpie，请先在 Magpie 中启用模型，再回到这里刷新。
              </Paragraph>
            </div>
            <Button loading={detecting} onClick={handleDiscover}>检测本机 Magpie</Button>
          </div>

          <div style={{ marginTop: 24, display: 'grid', gap: 18, maxWidth: 760 }}>
            <section>
              <Text strong>API 代理端点</Text>
              <Input value={baseUrl} onChange={setBaseUrl} style={{ marginTop: 8 }} placeholder={DEFAULT_BASE_URL} aria-label="API 代理端点" />
              <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 6 }}>
                第一版仅允许本机 Magpie 地址，例如 http://127.0.0.1:3425/v1。
              </Text>
            </section>

            <section>
              <Text strong>Gateway Key</Text>
              <Input
                mode="password"
                value={gatewayKey}
                onChange={setGatewayKey}
                style={{ marginTop: 8 }}
                placeholder={magpieProvider?.hasGatewayKey ? '已保存；留空表示不修改' : DEFAULT_GATEWAY_KEY}
                aria-label="Gateway Key"
              />
              <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 6 }}>
                本机连接可使用默认标识；保存后不会再次显示原文。
              </Text>
            </section>

            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <Text strong>模型</Text>
                <Button loading={loadingModels} onClick={handleRefreshModels}>刷新模型列表</Button>
              </div>
              <Select
                value={model || undefined}
                onChange={(value) => setModel(String(value))}
                placeholder="选择 Magpie 模型"
                filter
                style={{ width: '100%', marginTop: 8 }}
                emptyContent="暂无模型，请先刷新模型列表"
                aria-label="Magpie 模型"
              >
                {models.map((item) => <Select.Option key={item.id} value={item.id}>{item.id}</Select.Option>)}
                {model && !models.some((item) => item.id === model) ? <Select.Option value={model}>{model}</Select.Option> : null}
              </Select>
              <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 6 }}>
                当前模型：{model || '未选择'}
              </Text>
            </section>

            <section>
              <Text strong>高级设置</Text>
              <div style={{ marginTop: 8, maxWidth: 240 }}>
                <Input value={timeoutMs} onChange={setTimeoutMs} suffix="ms" aria-label="请求超时时间" />
              </div>
              <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 6 }}>请求超时时间。</Text>
            </section>

            {lastTest ? (
              <Card style={{ background: lastTest.ok ? 'var(--semi-color-success-light-default)' : 'var(--semi-color-danger-light-default)' }} bodyStyle={{ padding: 12 }}>
                <Text strong>{lastTest.ok ? '最近测试成功' : '最近测试失败'}</Text>
                <Text style={{ display: 'block', marginTop: 4 }}>{resultTitle(lastTest)}</Text>
              </Card>
            ) : null}

            <Space>
              <Button loading={testing} onClick={handleTest}>测试连接</Button>
              <Button theme="solid" type="primary" loading={saving} onClick={handleSave}>保存</Button>
            </Space>
          </div>
        </Card>
      </div>
    </Spin>
  );
}
