import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Accordion,
  Box,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import FileInput from '../common/components/FileInput';
import PasswordField from '../common/components/PasswordField';
import EditItemView from './components/EditItemView';
import FieldTip from './components/FieldTip';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useAdministrator, useManager } from '../common/util/permissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import { useCatch } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import QrCodeDialog from '../common/components/QrCodeDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';

const vehicleTypes = [
  'SUV',
  'HATCH',
  'SEDAN',
  'PICAPE',
  'UTILITÁRIO',
  'MOTO',
  'CAMINHÃO',
  'ÔNIBUS',
  'OUTRO',
];

const deviceImageSlots = [
  {
    slot: 'tracker',
    attribute: 'trackerImage',
    label: 'Foto do rastreador (IMEI e senha)',
    tip: 'Foto do rastreador mostrando o IMEI e a senha. Máx. 500 KB (jpg, png, gif ou webp). Salvo em attributes.trackerImage.',
  },
  {
    slot: 'plate',
    attribute: 'plateImage',
    label: 'Foto do rastreador com a placa',
    tip: 'Foto do rastreador junto da placa do veículo. Máx. 500 KB (jpg, png, gif ou webp). Salvo em attributes.plateImage.',
  },
  {
    slot: 'odometer',
    attribute: 'odometerImage',
    label: 'Foto do painel (odômetro)',
    tip: 'Foto do painel do veículo exibindo o odômetro. Máx. 500 KB (jpg, png, gif ou webp). Salvo em attributes.odometerImage.',
  },
];

const CopyButton = ({ value }) => {
  const t = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value ?? ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Tooltip title={copied ? 'Copiado!' : t('sharedCopy')}>
      <IconButton size="small" onClick={handleCopy} disabled={value == null || value === ''}>
        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

const DevicePage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const manager = useManager();
  const admin = useAdministrator();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [showQr, setShowQr] = useState(false);
  const [imageFiles, setImageFiles] = useState({});

  const handleFileInput = useCatch(async (slot, attribute, newFile) => {
    setImageFiles((files) => ({ ...files, [slot]: newFile }));
    if (newFile && item?.id) {
      const response = await fetchOrThrow(`/api/devices/${item.id}/image?slot=${slot}`, {
        method: 'POST',
        body: newFile,
      });
      setItem({ ...item, attributes: { ...item.attributes, [attribute]: await response.text() } });
    } else if (!newFile) {
      // eslint-disable-next-line no-unused-vars
      const { [attribute]: removed, ...remainingAttributes } = item.attributes || {};
      setItem({ ...item, attributes: remainingAttributes });
    }
  });

  const setAttribute = (key, value) =>
    setItem({
      ...item,
      attributes: { ...item.attributes, [key]: value },
    });

  const requiredSx = { '& .MuiFormLabel-asterisk': { color: 'error.main' } };

  const validate = () =>
    item &&
    item.name &&
    item.uniqueId &&
    item.attributes?.devicePassword &&
    item.attributes?.imeiSecundario;

  return (
    <EditItemView
      endpoint="devices"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedDevice']}
    >
      {item && (
        <>
          {item.id && (
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" noWrap sx={{ minWidth: 0 }}>
                  {item.name}
                </Typography>
                <CopyButton value={item.name} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {`ID do dispositivo: ${item.id}`}
                </Typography>
                <CopyButton value={item.id} />
              </Box>
            </Box>
          )}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedDeviceInfo')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <FieldTip title="Nome de exibição do device no mapa, listas e relatórios. Campo name.">
                <TextField
                  value={item.name || ''}
                  onChange={(event) => setItem({ ...item, name: event.target.value })}
                  label={t('sharedName')}
                  required
                  sx={requiredSx}
                />
              </FieldTip>
              <FieldTip title="ID que o rastreador envia no cabeçalho das mensagens. É por ele que a Localize-C associa as posições a este device. MV730G: IMEI. MV710G/MV710N: ID do rastreador. Precisa ser único. Campo uniqueId.">
                <TextField
                  value={item.uniqueId || ''}
                  onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                  label={t('deviceIdentifier')}
                  required
                  sx={requiredSx}
                  disabled={Boolean(uniqueId)}
                />
              </FieldTip>
              <FieldTip title="Senha do rastreador usada nos comandos por SMS (ex.: adminip123456,host:porta). Padrão de fábrica: 123456. Fica em texto puro em attributes.devicePassword.">
                <PasswordField
                  value={item.attributes?.devicePassword || ''}
                  onChange={(event) => setAttribute('devicePassword', event.target.value)}
                  label="Senha"
                  autoComplete="new-password"
                  required
                  sx={requiredSx}
                />
              </FieldTip>
              <FieldTip title="IMEI de 15 dígitos do módulo celular do rastreador. No MV730G é o mesmo valor do Identificador. Salvo em attributes.imeiSecundario.">
                <TextField
                  value={item.attributes?.imeiSecundario || ''}
                  onChange={(event) => setAttribute('imeiSecundario', event.target.value)}
                  label="IMEI"
                  helperText={t('deviceIdentifierHelp')}
                  required
                  sx={requiredSx}
                />
              </FieldTip>
              <FieldTip title="Grupo do device. O device herda permissões e atributos do grupo. Campo groupId.">
                <SelectField
                  value={item.groupId}
                  onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                  endpoint="/api/groups"
                  label={t('groupParent')}
                />
              </FieldTip>
              {admin && (
                <FieldTip title="Tenant (cliente/empresa) ao qual o device pertence. Vazio = sem tenant. Somente administradores podem alterar. Campo tenantId.">
                  <SelectField
                    value={item.tenantId || null}
                    onChange={(event) =>
                      setItem({ ...item, tenantId: Number(event.target.value) || 0 })
                    }
                    endpoint="/api/tenants"
                    label={t('sharedTenant')}
                  />
                </FieldTip>
              )}
              <FieldTip title="Número do chip (SIM) instalado no rastreador. Campo phone.">
                <TextField
                  value={item.phone || ''}
                  onChange={(event) => setItem({ ...item, phone: event.target.value })}
                  label={t('sharedPhone')}
                />
              </FieldTip>
              <FieldTip title="Data de instalação do rastreador. Campo installationDate.">
                <TextField
                  type="date"
                  value={item.installationDate ? item.installationDate.split('T')[0] : ''}
                  onChange={(e) =>
                    setItem({
                      ...item,
                      installationDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                  label={t('deviceInstallationDate')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </FieldTip>
              <FieldTip title="Com o device desativado, o servidor ignora as mensagens dele. Campo disabled.">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={item.disabled}
                      onChange={(event) => setItem({ ...item, disabled: event.target.checked })}
                    />
                  }
                  label={t('sharedDisabled')}
                  disabled={!manager}
                />
              </FieldTip>
              <Button variant="outlined" color="primary" onClick={() => setShowQr(true)}>
                {t('sharedQrCode')}
              </Button>
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedVehicleInfo')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <FieldTip title="Placa do veículo. Campo plate.">
                <TextField
                  value={item.plate || ''}
                  onChange={(event) => setItem({ ...item, plate: event.target.value })}
                  label={t('devicePlate')}
                />
              </FieldTip>
              <FieldTip title="Chassi do veículo. Campo chassis.">
                <TextField
                  value={item.chassis || ''}
                  onChange={(event) => setItem({ ...item, chassis: event.target.value })}
                  label={t('deviceChassis')}
                />
              </FieldTip>
              <FieldTip title="Modelo do veículo. Campo model.">
                <TextField
                  value={item.model || ''}
                  onChange={(event) => setItem({ ...item, model: event.target.value })}
                  label={t('deviceModel')}
                />
              </FieldTip>
              <FieldTip title="Tipo de carroceria do veículo. Campo vehicleType.">
                <SelectField
                  value={item.vehicleType || null}
                  onChange={(event) => setItem({ ...item, vehicleType: event.target.value })}
                  data={vehicleTypes.map((type) => ({ id: type, name: type }))}
                  label={t('deviceVehicleType')}
                />
              </FieldTip>
              <FieldTip title="Cor do veículo. Campo color.">
                <TextField
                  value={item.color || ''}
                  onChange={(event) => setItem({ ...item, color: event.target.value })}
                  label={t('deviceColor')}
                />
              </FieldTip>
              <FieldTip title="Fabricante do veículo. Campo manufacturer.">
                <TextField
                  value={item.manufacturer || ''}
                  onChange={(event) => setItem({ ...item, manufacturer: event.target.value })}
                  label={t('deviceManufacturer')}
                />
              </FieldTip>
              <FieldTip title="Ano de fabricação do veículo. Campo manufactureYear.">
                <TextField
                  type="number"
                  value={item.manufactureYear ?? ''}
                  onChange={(event) =>
                    setItem({
                      ...item,
                      manufactureYear: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  label={t('deviceManufactureYear')}
                />
              </FieldTip>
              <FieldTip title="Ano do modelo do veículo. Campo modelYear.">
                <TextField
                  type="number"
                  value={item.modelYear ?? ''}
                  onChange={(event) =>
                    setItem({
                      ...item,
                      modelYear: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  label={t('deviceModelYear')}
                />
              </FieldTip>
            </AccordionDetails>
          </Accordion>
          {item.id && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">{t('sharedDevicePhotos')}</Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                {deviceImageSlots.map(({ slot, attribute, label, tip }) => (
                  <FieldTip key={slot} title={tip}>
                    <Box>
                      <FileInput
                        placeholder={label}
                        value={imageFiles[slot] ?? null}
                        onChange={(file) => handleFileInput(slot, attribute, file)}
                        slotProps={{
                          htmlInput: { accept: 'image/jpeg,image/png,image/gif,image/webp' },
                        }}
                      />
                      {item.attributes?.[attribute] && (
                        <Typography variant="caption" color="text.secondary">
                          {`Arquivo atual: ${item.attributes[attribute]}`}
                        </Typography>
                      )}
                    </Box>
                  </FieldTip>
                ))}
              </AccordionDetails>
            </Accordion>
          )}
          <EditAttributesAccordion
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
          />
        </>
      )}
      <QrCodeDialog open={showQr} onClose={() => setShowQr(false)} />
    </EditItemView>
  );
};

export default DevicePage;
