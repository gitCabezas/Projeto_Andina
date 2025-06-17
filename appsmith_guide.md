# Guia Completo: Sistema de Tinturaria no Appsmith

## 1. Preparação Inicial

### 1.1 Configuração do Banco de Dados
1. **Criar conta no Supabase/PostgreSQL**
   - Acesse [supabase.com](https://supabase.com) ou configure PostgreSQL local
   - Execute o schema Prisma que criamos anteriormente
   - Anote a connection string

2. **Configurar no Appsmith**
   - Login no Appsmith
   - Criar nova aplicação: "Sistema Tinturaria"
   - Adicionar datasource PostgreSQL
   - Conectar com as credenciais do banco

### 1.2 Estrutura de Páginas
Criar as seguintes páginas:
- `Home` (Dashboard principal)
- `Login` (Autenticação)
- `Clientes` (CRUD Clientes)
- `Materias` (CRUD Matérias-prima)
- `Corantes` (CRUD Corantes)
- `Quimicos` (CRUD Químicos)
- `Cores` (CRUD Cores)
- `Receitas` (CRUD Receituários)
- `Producao` (Gestão de Produção)
- `Qualidade` (Controle de Qualidade)
- `Estoque` (Controle de Estoque)
- `Relatorios` (Analytics)

## 2. Sistema de Autenticação

### 2.1 Página de Login
```javascript
// Query: LoginUser
SELECT id, name, email, role, active 
FROM users 
WHERE email = '{{Input_Email.text}}' 
AND password = crypt('{{Input_Password.text}}', password)
AND active = true;
```

**Widgets necessários:**
- `Input_Email` (type: email)
- `Input_Password` (type: password)
- `Button_Login`
- `Text_Error` (para mensagens de erro)

**Ação do botão Login:**
```javascript
// OnClick do Button_Login
if(LoginUser.data.length > 0) {
  storeValue('currentUser', LoginUser.data[0]);
  storeValue('userRole', LoginUser.data[0].role);
  navigateTo('Home');
} else {
  showAlert('Credenciais inválidas', 'error');
}
```

### 2.2 Controle de Acesso por Página
Em cada página, adicionar no `onPageLoad`:
```javascript
// Verificar se usuário está logado
if(!appsmith.store.currentUser) {
  navigateTo('Login');
  return;
}

// Verificar permissões específicas
const userRole = appsmith.store.userRole;
const allowedRoles = ['SUPERVISOR', 'MANAGER']; // Adaptar por página

if(!allowedRoles.includes(userRole)) {
  showAlert('Acesso negado', 'error');
  navigateTo('Home');
}
```

## 3. Dashboard Principal (Home)

### 3.1 Cards de Métricas
**Query: DashboardMetrics**
```sql
SELECT 
  (SELECT COUNT(*) FROM production_records WHERE status = 'IN_PROGRESS') as producao_ativa,
  (SELECT COUNT(*) FROM orders WHERE status = 'PENDING') as pedidos_pendentes,
  (SELECT COUNT(*) FROM recipes WHERE status = 'APPROVED') as receitas_ativas,
  (SELECT COUNT(*) FROM quality_controls WHERE approved = false AND created_at > CURRENT_DATE) as qualidade_pendente;
```

**Widgets:**
- 4 `Stat_Box` widgets para cada métrica
- Configurar cores diferentes para cada card

### 3.2 Gráfico de Produção
**Query: ProductionChart**
```sql
SELECT 
  DATE(created_at) as data,
  COUNT(*) as lotes_produzidos,
  SUM(actual_weight) as peso_total
FROM production_records 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY data;
```

**Widget:** `Chart_Production`
- Type: Line Chart
- X-axis: data
- Y-axis: lotes_produzidos

### 3.3 Alertas de Estoque
**Query: StockAlerts**
```sql
SELECT name, current_stock, minimum_stock, 'raw_material' as type
FROM raw_materials 
WHERE current_stock <= minimum_stock AND active = true
UNION ALL
SELECT name, current_stock, minimum_stock, 'dye' as type
FROM dyes 
WHERE current_stock <= minimum_stock AND active = true
UNION ALL
SELECT name, current_stock, minimum_stock, 'chemical' as type
FROM chemicals 
WHERE current_stock <= minimum_stock AND active = true;
```

**Widget:** `List_Alerts`
- Mostrar itens com estoque baixo
- Cores de alerta (vermelho/amarelo)

## 4. CRUD de Clientes

### 4.1 Query Principal
```sql
-- GetClients
SELECT id, name, document, email, phone, active, created_at
FROM clients 
WHERE active = true 
ORDER BY name;
```

### 4.2 Layout da Página
**Widgets principais:**
- `Table_Clients` (listagem)
- `Button_New` (novo cliente)
- `Modal_Client` (formulário)
- `Form_Client` (dentro do modal)

### 4.3 Formulário de Cliente
**Inputs no Form_Client:**
- `Input_Name` (obrigatório)
- `Input_Document` (CNPJ/CPF com máscara)
- `Input_Email` (validação de email)
- `Input_Phone` (máscara de telefone)
- `Input_Address`
- `TextArea_Observations`

### 4.4 Queries CRUD
```sql
-- CreateClient
INSERT INTO clients (name, document, email, phone, address, observations)
VALUES (
  '{{Form_Client.data.Input_Name}}',
  '{{Form_Client.data.Input_Document}}',
  '{{Form_Client.data.Input_Email}}',
  '{{Form_Client.data.Input_Phone}}',
  '{{Form_Client.data.Input_Address}}',
  '{{Form_Client.data.Input_Observations}}'
);

-- UpdateClient
UPDATE clients SET
  name = '{{Form_Client.data.Input_Name}}',
  document = '{{Form_Client.data.Input_Document}}',
  email = '{{Form_Client.data.Input_Email}}',
  phone = '{{Form_Client.data.Input_Phone}}',
  address = '{{Form_Client.data.Input_Address}}',
  observations = '{{Form_Client.data.Input_Observations}}',
  updated_at = NOW()
WHERE id = '{{Table_Clients.selectedRow.id}}';

-- DeleteClient (Soft Delete)
UPDATE clients SET active = false WHERE id = '{{Table_Clients.selectedRow.id}}';
```

### 4.5 Ações dos Botões
```javascript
// Button_New OnClick
resetWidget('Form_Client');
showModal('Modal_Client');
storeValue('editingClient', null);

// Button_Edit OnClick (na tabela)
storeValue('editingClient', Table_Clients.selectedRow);
showModal('Modal_Client');

// Button_Save OnClick (no formulário)
if(appsmith.store.editingClient) {
  UpdateClient.run(() => {
    closeModal('Modal_Client');
    GetClients.run();
    showAlert('Cliente atualizado!', 'success');
  });
} else {
  CreateClient.run(() => {
    closeModal('Modal_Client');
    GetClients.run();
    showAlert('Cliente criado!', 'success');
  });
}
```

## 5. CRUD de Matérias-Prima

### 5.1 Estrutura Similar ao Clientes
**Campos específicos:**
- `Select_Type` (enum RawMaterialType)
- `Input_Composition`
- `Input_Weight` (gramatura)
- `Input_Width` (largura)
- `Select_Supplier`
- `Input_CurrentStock`
- `Input_MinimumStock`
- `Input_UnitPrice`

### 5.2 Query com Join
```sql
-- GetRawMaterials
SELECT 
  rm.id, rm.name, rm.type, rm.composition, rm.weight, rm.width,
  rm.current_stock, rm.minimum_stock, rm.unit_price,
  s.name as supplier_name,
  CASE WHEN rm.current_stock <= rm.minimum_stock THEN 'low' ELSE 'ok' END as stock_status
FROM raw_materials rm
LEFT JOIN suppliers s ON rm.supplier_id = s.id
WHERE rm.active = true
ORDER BY rm.name;
```

### 5.3 Configuração da Tabela
**Colunas da Table_RawMaterials:**
- Nome
- Tipo
- Fornecedor
- Estoque Atual
- Estoque Mínimo
- Status (com cores condicionais)

**Formatação condicional:**
```javascript
// Coluna Stock Status
{{Table_RawMaterials.processedTableData.map((currentRow, currentIndex) => {
  if(currentRow.stock_status === 'low') {
    return {
      backgroundColor: '#ffebee',
      textColor: '#c62828'
    }
  }
  return {};
})}}
```

## 6. Sistema de Receituários

### 6.1 Página de Receitas - Layout Complexo
**Estrutura:**
- `Container_Left` (lista de receitas)
- `Container_Right` (formulário/detalhes)
- `Modal_Process` (definir processos)
- `Modal_Items` (adicionar itens)

### 6.2 Query Principal das Receitas
```sql
-- GetRecipes
SELECT 
  r.id, r.name, r.version, r.batch_weight, r.liquor_ratio,
  r.status, r.created_at,
  c.name as color_name, c.pantone_code,
  rm.name as raw_material_name,
  cl.name as client_name,
  u.name as created_by_name
FROM recipes r
JOIN colors c ON r.color_id = c.id
JOIN raw_materials rm ON r.raw_material_id = rm.id
JOIN clients cl ON c.client_id = cl.id
JOIN users u ON r.created_by_id = u.id
WHERE r.active = true
ORDER BY r.created_at DESC;
```

### 6.3 Formulário de Nova Receita - Wizard
**Step 1: Informações Básicas**
```javascript
// Form_Recipe_Step1
- Input_Name
- Select_Client (onChange recarrega cores)
- Select_Color
- Select_RawMaterial
- Input_BatchWeight
- Input_LiquorRatio
```

**Step 2: Itens da Receita**
```javascript
// List_RecipeItems
- Button_AddDye (adicionar corante)
- Button_AddChemical (adicionar químico)
- Table_Items (itens adicionados)
```

**Step 3: Processos**
```javascript
// Accordion_Processes
- Container_Preparation
- Container_Dyeing  
- Container_Washing
- Container_Finishing
```

### 6.4 Query para Adicionar Itens
```sql
-- AddRecipeItem
INSERT INTO recipe_items (
  recipe_id, item_type, dye_id, chemical_id, 
  quantity, unit, percentage, process_stage, 
  addition_time, observations
) VALUES (
  '{{appsmith.store.currentRecipeId}}',
  '{{Modal_AddItem.data.item_type}}',
  '{{Modal_AddItem.data.dye_id}}',
  '{{Modal_AddItem.data.chemical_id}}',
  {{Modal_AddItem.data.quantity}},
  '{{Modal_AddItem.data.unit}}',
  {{Modal_AddItem.data.percentage}},
  '{{Modal_AddItem.data.process_stage}}',
  {{Modal_AddItem.data.addition_time}},
  '{{Modal_AddItem.data.observations}}'
);
```

### 6.5 Visualização do Processo (Gráfico)
**Widget:** `Container_ProcessFlow`
```javascript
// HTML personalizado para mostrar o fluxo
<div class="process-flow">
  <div class="step active" data-step="preparation">
    <h4>Preparação</h4>
    <p>{{ProcessSteps.data.filter(s => s.stage === 'PREPARATION').length}} etapas</p>
  </div>
  <div class="arrow">→</div>
  <div class="step" data-step="dyeing">
    <h4>Tingimento</h4>
    <p>{{ProcessSteps.data.filter(s => s.stage === 'DYEING').length}} etapas</p>
  </div>
  <div class="arrow">→</div>
  <div class="step" data-step="washing">
    <h4>Lavagem</h4>
    <p>{{ProcessSteps.data.filter(s => s.stage === 'WASHING').length}} etapas</p>
  </div>
  <div class="arrow">→</div>
  <div class="step" data-step="finishing">
    <h4>Acabamento</h4>
    <p>{{ProcessSteps.data.filter(s => s.stage === 'FINISHING').length}} etapas</p>
  </div>
</div>
```

## 7. Módulo de Produção

### 7.1 Painel de Controle da Produção
**Layout:**
- `Container_ActiveProductions` (produções ativas)
- `Container_PendingOrders` (pedidos pendentes)
- `Modal_StartProduction` (iniciar produção)

### 7.2 Query de Produções Ativas
```sql
-- GetActiveProductions
SELECT 
  pr.id, pr.batch_number, pr.start_time, pr.status,
  pr.actual_weight,
  o.order_number,
  c.name as client_name,
  col.name as color_name,
  r.name as recipe_name,
  u.name as operator_name,
  -- Progresso da produção
  (SELECT COUNT(*) FROM production_steps ps WHERE ps.production_id = pr.id AND ps.status = 'COMPLETED') as completed_steps,
  (SELECT COUNT(*) FROM production_steps ps WHERE ps.production_id = pr.id) as total_steps
FROM production_records pr
JOIN orders o ON pr.order_id = o.id
JOIN clients c ON o.client_id = c.id
JOIN colors col ON o.color_id = col.id
JOIN recipes r ON pr.recipe_id = r.id
JOIN users u ON pr.operator_id = u.id
WHERE pr.status = 'IN_PROGRESS'
ORDER BY pr.start_time;
```

### 7.3 Card de Produção Ativa
**Widget personalizado para cada produção:**
```javascript
// Progress_Production
{{Math.round((currentRow.completed_steps / currentRow.total_steps) * 100)}}%
```

**Indicador visual de status:**
```javascript
// Status_Color
{{
  currentRow.status === 'IN_PROGRESS' ? '#4caf50' :
  currentRow.status === 'ON_HOLD' ? '#ff9800' :
  currentRow.status === 'FAILED' ? '#f44336' : '#2196f3'
}}
```

### 7.4 Iniciar Nova Produção
**Modal_StartProduction:**
- `Select_Order` (pedidos pendentes)
- `Select_Recipe` (receitas aprovadas)
- `Select_Operator`
- `Input_ActualWeight`
- `TextArea_Observations`

```sql
-- StartProduction
INSERT INTO production_records (
  batch_number, order_id, recipe_id, operator_id,
  start_time, actual_weight, status, observations
) VALUES (
  'LOTE-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MI'),
  '{{Modal_StartProduction.data.order_id}}',
  '{{Modal_StartProduction.data.recipe_id}}',
  '{{Modal_StartProduction.data.operator_id}}',
  NOW(),
  {{Modal_StartProduction.data.actual_weight}},
  'IN_PROGRESS',
  '{{Modal_StartProduction.data.observations}}'
) RETURNING id;
```

## 8. Interface do Operador (Mobile-First)

### 8.1 Página Otimizada para Tablet
**Layout específico:**
- Cards grandes com touch targets
- Fontes maiores
- Cores contrastantes
- Botões de ação destacados

### 8.2 Scanner de Código (se disponível)
```javascript
// Simulação de scanner - Input_ScanCode
// onTextChanged
if(Input_ScanCode.text.length >= 8) {
  SearchProduction.run();
}
```

### 8.3 Timer Visual
**Widget:** `Container_Timer`
```javascript
// Text_Timer (atualizacao a cada segundo)
{{
  (() => {
    const startTime = new Date(appsmith.store.stepStartTime);
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  })()
}}
```

### 8.4 Registro de Etapas
**Form_StepRecord:**
- `Input_Temperature` (com validação de range)
- `Input_pH` (com validação de range)
- `Input_Time` (tempo real gasto)
- `TextArea_Observations`
- `Camera_Photo` (se disponível)

## 9. Controle de Estoque

### 9.1 Dashboard de Estoque
**Queries necessárias:**
```sql
-- GetLowStock
SELECT 'raw_material' as type, name, current_stock, minimum_stock,
       (current_stock - minimum_stock) as difference
FROM raw_materials 
WHERE current_stock <= minimum_stock AND active = true
UNION ALL
SELECT 'dye' as type, name, current_stock, minimum_stock,
       (current_stock - minimum_stock) as difference
FROM dyes 
WHERE current_stock <= minimum_stock AND active = true
UNION ALL
SELECT 'chemical' as type, name, current_stock, minimum_stock,
       (current_stock - minimum_stock) as difference
FROM chemicals 
WHERE current_stock <= minimum_stock AND active = true;
```

### 9.2 Movimentação de Estoque
**Form_StockMovement:**
- `Select_Type` (INPUT, OUTPUT, ADJUSTMENT)
- `Select_ItemType` (raw_material, dye, chemical)
- `Select_Item` (baseado no tipo selecionado)
- `Input_Quantity`
- `Input_UnitPrice`
- `Input_Reason`
- `Input_DocumentNumber`

## 10. Relatórios e Analytics

### 10.1 Relatório de Custos
```sql
-- GetCostReport
SELECT 
  r.name as recipe_name,
  c.name as client_name,
  col.name as color_name,
  COUNT(pr.id) as productions_count,
  AVG(pr.actual_weight) as avg_weight,
  SUM(sm.total_price) as total_cost,
  (SUM(sm.total_price) / NULLIF(SUM(pr.actual_weight), 0)) as cost_per_kg
FROM recipes r
JOIN colors col ON r.color_id = col.id
JOIN clients c ON col.client_id = c.id
LEFT JOIN production_records pr ON pr.recipe_id = r.id
LEFT JOIN stock_movements sm ON sm.production_id = pr.id
WHERE pr.created_at >= '{{DatePicker_From.selectedDate}}'
  AND pr.created_at <= '{{DatePicker_To.selectedDate}}'
GROUP BY r.id, r.name, c.name, col.name
ORDER BY total_cost DESC;
```

### 10.2 Charts Avançados
**Chart_CostTrend:**
- Type: Line Chart
- Data: custos ao longo do tempo
- Filtros por cliente/período

**Chart_ProductionVolume:**
- Type: Bar Chart
- Data: volume de produção por mês
- Comparativo ano anterior

## 11. Configurações Avançadas

### 11.1 Notificações Push (Email)
```javascript
// Função para enviar alertas
const sendAlert = async (type, message, recipients) => {
  // Integração com serviço de email
  await EmailService.run({
    to: recipients,
    subject: `[Tinturaria] ${type}`,
    body: message
  });
};

// Trigger automático para estoque baixo
if(GetLowStock.data.length > 0) {
  sendAlert('Alerta de Estoque', 
           `${GetLowStock.data.length} itens com estoque baixo`,
           ['supervisor@empresa.com']);
}
```

### 11.2 Backup Automático
```javascript
// Scheduled job (se disponível)
const backupData = () => {
  const data = {
    clients: GetAllClients.data,
    recipes: GetAllRecipes.data,
    productions: GetAllProductions.data
  };
  
  // Salvar em storage externo ou enviar por email
  storeValue('lastBackup', new Date().toISOString());
};
```

## 12. Deploy e Manutenção

### 12.1 Configuração de Ambientes
- **Desenvolvimento**: Banco local/teste
- **Produção**: Banco dedicado com backup

### 12.2 Monitoramento
- Queries de performance
- Logs de erro
- Métricas de uso

### 12.3 Treinamento dos Usuários
- Documentação específica por perfil
- Vídeos tutoriais
- Suporte durante implantação

## Próximos Passos

1. **Começar pelo banco**: Configure o PostgreSQL e execute o schema
2. **Autenticação primeiro**: Implemente o sistema de login
3. **CRUDs básicos**: Clientes, fornecedores, insumos
4. **Receituários**: Sistema de criação de receitas
5. **Produção**: Interface operacional
6. **Relatórios**: Analytics e métricas
7. **Otimizações**: Performance e UX
8. **Testes**: Validação com usuários reais

Este guia fornece uma base sólida para implementar todo o sistema no Appsmith. Cada seção pode ser desenvolvida incrementalmente, permitindo testes e ajustes contínuos com os usuários finais.