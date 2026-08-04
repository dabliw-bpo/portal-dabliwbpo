import { inputToggleable } from "@/components/ui/styles";
import { BRANCH_TYPES, COMPANY_SIZES, REGISTRATION_STATUSES } from "@/lib/validations/company";

export type CompanyRegistrationValues = {
  name: string;
  cnpj: string;
  tradeName: string;
  openingDate: string;
  branchType: string;
  legalNature: string;
  companySize: string;
  mainActivity: string;
  secondaryActivities: string;
  street: string;
  streetNumber: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  federalEntity: string;
  registrationStatus: string;
  registrationStatusDate: string;
  registrationStatusReason: string;
  specialStatus: string;
  specialStatusDate: string;
};

export const emptyRegistrationValues: CompanyRegistrationValues = {
  name: "",
  cnpj: "",
  tradeName: "",
  openingDate: "",
  branchType: "",
  legalNature: "",
  companySize: "",
  mainActivity: "",
  secondaryActivities: "",
  street: "",
  streetNumber: "",
  complement: "",
  district: "",
  city: "",
  state: "",
  zipCode: "",
  email: "",
  phone: "",
  federalEntity: "",
  registrationStatus: "",
  registrationStatusDate: "",
  registrationStatusReason: "",
  specialStatus: "",
  specialStatusDate: "",
};

const COMPANY_SIZE_LABELS: Record<(typeof COMPANY_SIZES)[number], string> = {
  ME: "ME (Microempresa)",
  EPP: "EPP (Empresa de Pequeno Porte)",
  DEMAIS: "Demais",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </legend>
      <div className="mt-2 grid gap-4 sm:grid-cols-6">{children}</div>
    </fieldset>
  );
}

function Field({
  name,
  label,
  span = 3,
  children,
}: {
  name: string;
  label: string;
  span?: 2 | 3 | 4 | 6;
  children: React.ReactNode;
}) {
  const spanClass = {
    2: "sm:col-span-2",
    3: "sm:col-span-3",
    4: "sm:col-span-4",
    6: "sm:col-span-6",
  }[span];

  return (
    <div className={`flex flex-col gap-1 ${spanClass}`}>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * The Cartão CNPJ field set, shared by the "nova empresa" form and the
 * company's "Cadastro" tab. Rendering is uncontrolled: `disabled` switches
 * the whole set between read-only and editable without losing values, so a
 * `form.reset()` restores the original data on cancel.
 */
export function CompanyRegistrationFields({
  values,
  disabled,
}: {
  values: CompanyRegistrationValues;
  disabled?: boolean;
}) {
  const fieldClass = inputToggleable;

  return (
    <div className="flex flex-col gap-4">
      <Section title="Identificação">
        <Field name="cnpj" label="Número de inscrição (CNPJ)" span={3}>
          <input
            id="cnpj"
            name="cnpj"
            defaultValue={values.cnpj}
            disabled={disabled}
            placeholder="00.000.000/0000-00"
            className={fieldClass}
          />
        </Field>
        <Field name="branchType" label="Matriz / Filial" span={3}>
          <select
            id="branchType"
            name="branchType"
            defaultValue={values.branchType}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">Não informado</option>
            {BRANCH_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field name="name" label="Nome empresarial (razão social)" span={6}>
          <input
            id="name"
            name="name"
            required
            defaultValue={values.name}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="tradeName" label="Título do estabelecimento (nome fantasia)" span={4}>
          <input
            id="tradeName"
            name="tradeName"
            defaultValue={values.tradeName}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="openingDate" label="Data de abertura" span={2}>
          <input
            id="openingDate"
            name="openingDate"
            type="date"
            defaultValue={values.openingDate}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="companySize" label="Porte" span={3}>
          <select
            id="companySize"
            name="companySize"
            defaultValue={values.companySize}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">Não informado</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {COMPANY_SIZE_LABELS[size]}
              </option>
            ))}
          </select>
        </Field>
        <Field name="legalNature" label="Código e descrição da natureza jurídica" span={3}>
          <input
            id="legalNature"
            name="legalNature"
            defaultValue={values.legalNature}
            disabled={disabled}
            placeholder="206-2 - Sociedade Empresária Limitada"
            className={fieldClass}
          />
        </Field>
      </Section>

      <Section title="Atividades econômicas">
        <Field name="mainActivity" label="Código e descrição da atividade econômica principal" span={6}>
          <input
            id="mainActivity"
            name="mainActivity"
            defaultValue={values.mainActivity}
            disabled={disabled}
            placeholder="49.30-2-02 - Transporte rodoviário de carga"
            className={fieldClass}
          />
        </Field>
        <Field
          name="secondaryActivities"
          label="Código e descrição das atividades econômicas secundárias"
          span={6}
        >
          <textarea
            id="secondaryActivities"
            name="secondaryActivities"
            rows={4}
            defaultValue={values.secondaryActivities}
            disabled={disabled}
            placeholder="Uma atividade por linha"
            className={fieldClass}
          />
        </Field>
      </Section>

      <Section title="Endereço">
        <Field name="street" label="Logradouro" span={4}>
          <input
            id="street"
            name="street"
            defaultValue={values.street}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="streetNumber" label="Número" span={2}>
          <input
            id="streetNumber"
            name="streetNumber"
            defaultValue={values.streetNumber}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="complement" label="Complemento" span={3}>
          <input
            id="complement"
            name="complement"
            defaultValue={values.complement}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="zipCode" label="CEP" span={3}>
          <input
            id="zipCode"
            name="zipCode"
            defaultValue={values.zipCode}
            disabled={disabled}
            placeholder="00.000-000"
            className={fieldClass}
          />
        </Field>
        <Field name="district" label="Bairro / Distrito" span={2}>
          <input
            id="district"
            name="district"
            defaultValue={values.district}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="city" label="Município" span={2}>
          <input
            id="city"
            name="city"
            defaultValue={values.city}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="state" label="UF" span={2}>
          <input
            id="state"
            name="state"
            maxLength={2}
            defaultValue={values.state}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
      </Section>

      <Section title="Contato">
        <Field name="email" label="Endereço eletrônico" span={3}>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={values.email}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="phone" label="Telefone" span={3}>
          <input
            id="phone"
            name="phone"
            defaultValue={values.phone}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
      </Section>

      <Section title="Situação cadastral">
        <Field name="registrationStatus" label="Situação cadastral" span={3}>
          <select
            id="registrationStatus"
            name="registrationStatus"
            defaultValue={values.registrationStatus}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">Não informado</option>
            {REGISTRATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>
        <Field name="registrationStatusDate" label="Data da situação cadastral" span={3}>
          <input
            id="registrationStatusDate"
            name="registrationStatusDate"
            type="date"
            defaultValue={values.registrationStatusDate}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="registrationStatusReason" label="Motivo de situação cadastral" span={6}>
          <input
            id="registrationStatusReason"
            name="registrationStatusReason"
            defaultValue={values.registrationStatusReason}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="specialStatus" label="Situação especial" span={3}>
          <input
            id="specialStatus"
            name="specialStatus"
            defaultValue={values.specialStatus}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="specialStatusDate" label="Data da situação especial" span={3}>
          <input
            id="specialStatusDate"
            name="specialStatusDate"
            type="date"
            defaultValue={values.specialStatusDate}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
        <Field name="federalEntity" label="Ente federativo responsável (EFR)" span={6}>
          <input
            id="federalEntity"
            name="federalEntity"
            defaultValue={values.federalEntity}
            disabled={disabled}
            className={fieldClass}
          />
        </Field>
      </Section>
    </div>
  );
}
