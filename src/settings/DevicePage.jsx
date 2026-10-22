import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PasswordField from '../common/components/PasswordField';
import EditItemView from './components/EditItemView';
import FieldTip from './components/FieldTip';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useManager } from '../common/util/permissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import useSettingsStyles from './common/useSettingsStyles';
import QrCodeDialog from '../common/components/QrCodeDialog';

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

const DevicePage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const manager = useManager();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const [searchParams] = useSearchParams();
  const uniqueId = searchParams.get('uniqueId');

  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [showQr, setShowQr] = useState(false);

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
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedRequired')}</Typography>
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
            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">{t('sharedExtra')}</Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <FieldTip title="Grupo do device. O device herda permissões e atributos do grupo. Campo groupId.">
                <SelectField
                  value={item.groupId}
                  onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                  endpoint="/api/groups"
                  label={t('groupParent')}
                />
              </FieldTip>
              <FieldTip title="Número do chip (SIM) instalado no rastreador. Campo phone.">
                <TextField
                  value={item.phone || ''}
                  onChange={(event) => setItem({ ...item, phone: event.target.value })}
                  label={t('sharedPhone')}
                />
              </FieldTip>
              <FieldTip title="Modelo do rastreador, ex.: MV730G. Apenas informativo. Campo model.">
                <TextField
                  value={item.model || ''}
                  onChange={(event) => setItem({ ...item, model: event.target.value })}
                  label={t('deviceModel')}
                />
              </FieldTip>
              <FieldTip title="Contato responsável pelo veículo ou rastreador. Apenas informativo. Campo contact.">
                <TextField
                  value={item.contact || ''}
                  onChange={(event) => setItem({ ...item, contact: event.target.value })}
                  label={t('deviceContact')}
                />
              </FieldTip>
              <FieldTip title="Categoria do device. Define o ícone exibido no mapa. Campo category.">
                <SelectField
                  value={item.category || 'default'}
                  onChange={(event) => setItem({ ...item, category: event.target.value })}
                  data={deviceCategories
                    .map((category) => ({
                      id: category,
                      name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))}
                  label={t('deviceCategory')}
                />
              </FieldTip>
              <FieldTip title="Modelo do veículo onde o rastreador está instalado. Campo vehicleModel.">
                <TextField
                  value={item.vehicleModel || ''}
                  onChange={(event) => setItem({ ...item, vehicleModel: event.target.value })}
                  label={t('deviceVehicleModel')}
                />
              </FieldTip>
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
                  InputLabelProps={{ shrink: true }}
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
              <FieldTip title="Calendário vinculado ao device, usado em regras que dependem de horário. Campo calendarId.">
                <SelectField
                  value={item.calendarId}
                  onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                  endpoint="/api/calendars"
                  label={t('sharedCalendar')}
                />
              </FieldTip>
              <FieldTip title="Depois dessa data o servidor passa a recusar as mensagens do device. Só administrador ou gerente altera. Campo expirationTime.">
                <TextField
                  label={t('userExpirationTime')}
                  type="date"
                  value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                  onChange={(e) => {
                    if (e.target.value) {
                      setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                    }
                  }}
                  disabled={!manager}
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
