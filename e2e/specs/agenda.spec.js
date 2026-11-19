import { test, expect } from "@playwright/test";

const PREFIXO = "E2E";
const DIA = "2030-03-15";
const DIA_TEXTO = /15 de março de 2030/;

const compromisso = (sufixo, extra = {}) => ({
    titulo: `${PREFIXO} ${sufixo}`,
    data: DIA,
    hora: "09:30",
    descricao: "",
    ...extra,
});

async function limpar(request) {
    const resposta = await request.get("/api/compromissos");
    const itens = await resposta.json();
    for (const item of itens.filter((i) => i.titulo.startsWith(PREFIXO))) {
        await request.delete(`/api/compromissos/${item.id}`);
    }
}

async function criarViaApi(request, dados) {
    const resposta = await request.post("/api/compromissos", { data: dados });
    expect(resposta.status()).toBe(201);
    return resposta.json();
}

const itemDaLista = (page, titulo) => page.getByRole("listitem").filter({ hasText: titulo });

test.beforeEach(async ({ request }) => {
    await limpar(request);
});

// Declarado antes da limpeza para capturar o estado final do teste, inclusive em falhas.
test.afterEach(async ({ page }, testInfo) => {
    await test.step("Captura de tela", async () => {
        const caminho = testInfo.outputPath("captura.png");
        await page.screenshot({ path: caminho, fullPage: true });
        await testInfo.attach("captura-de-tela", { path: caminho, contentType: "image/png" });
    });
});

test.afterEach(async ({ request }) => {
    await limpar(request);
});

test.describe("Agenda", () => {
    test("E01 carrega a página com formulário e calendário @smoke", async ({ page }) => {
        await page.goto("/");

        await expect(page.getByRole("heading", { name: "Agenda", level: 1 })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Novo compromisso" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Adicionar" })).toBeVisible();
        await expect(page.getByRole("complementary").getByText("Seg", { exact: true })).toBeVisible();
    });

    test("E02 cria compromisso pelo formulário e limpa os campos @smoke", async ({ page }) => {
        const dados = compromisso("criar", { descricao: "Descrição do compromisso" });
        await page.goto("/");

        await page.getByRole("textbox", { name: "Título" }).fill(dados.titulo);
        await page.getByRole("textbox", { name: "Data" }).fill(dados.data);
        await page.getByRole("textbox", { name: "Hora" }).fill(dados.hora);
        await page.getByRole("textbox", { name: "Descrição" }).fill(dados.descricao);
        await page.getByRole("button", { name: "Adicionar" }).click();

        const item = itemDaLista(page, dados.titulo);
        await expect(item).toBeVisible();
        await expect(item).toContainText("09:30");
        await expect(item).toContainText(dados.descricao);
        await expect(page.getByRole("heading", { level: 3, name: DIA_TEXTO })).toBeVisible();
        await expect(page.getByRole("textbox", { name: "Título" })).toHaveValue("");
        await expect(page.getByRole("textbox", { name: "Data" })).toHaveValue("");
    });

    test("E03 mantém o compromisso após recarregar a página", async ({ page, request }) => {
        const dados = compromisso("persistir");
        await criarViaApi(request, dados);

        await page.goto("/");
        await expect(itemDaLista(page, dados.titulo)).toBeVisible();
        await page.reload();

        await expect(itemDaLista(page, dados.titulo)).toBeVisible();
    });

    test("E04 exibe o erro do servidor para título só com espaços", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("textbox", { name: "Título" }).fill("   ");
        await page.getByRole("textbox", { name: "Data" }).fill(DIA);
        await page.getByRole("textbox", { name: "Hora" }).fill("09:30");
        await page.getByRole("button", { name: "Adicionar" }).click();

        await expect(page.getByRole("alert")).toHaveText("Título obrigatório (até 120 caracteres).");
        await expect(page.getByRole("textbox", { name: "Data" })).toHaveValue(DIA);
    });

    test("E05 bloqueia o envio com campos obrigatórios vazios", async ({ page }) => {
        await page.goto("/");

        await page.getByRole("button", { name: "Adicionar" }).click();

        const titulo = page.getByRole("textbox", { name: "Título" });
        expect(await titulo.evaluate((el) => el.validity.valueMissing)).toBe(true);
        await expect(page.getByRole("alert")).toHaveCount(0);
    });

    test("E06 edita um compromisso existente", async ({ page, request }) => {
        const dados = compromisso("editar original", { descricao: "Original" });
        await criarViaApi(request, dados);
        await page.goto("/");

        await itemDaLista(page, dados.titulo).getByRole("button", { name: "Editar" }).click();

        await expect(page.getByRole("heading", { name: "Editar compromisso" })).toBeVisible();
        await expect(page.getByRole("textbox", { name: "Título" })).toHaveValue(dados.titulo);
        await expect(page.getByRole("textbox", { name: "Hora" })).toHaveValue("09:30");

        const novoTitulo = `${PREFIXO} editar atualizado`;
        await page.getByRole("textbox", { name: "Título" }).fill(novoTitulo);
        await page.getByRole("button", { name: "Salvar" }).click();

        await expect(itemDaLista(page, novoTitulo)).toBeVisible();
        await expect(itemDaLista(page, dados.titulo)).toHaveCount(0);
        await expect(page.getByRole("heading", { name: "Novo compromisso" })).toBeVisible();
    });

    test("E07 cancela a edição e restaura o formulário vazio", async ({ page, request }) => {
        const dados = compromisso("cancelar edição");
        await criarViaApi(request, dados);
        await page.goto("/");

        await itemDaLista(page, dados.titulo).getByRole("button", { name: "Editar" }).click();
        await page.getByRole("button", { name: "Cancelar" }).click();

        await expect(page.getByRole("heading", { name: "Novo compromisso" })).toBeVisible();
        await expect(page.getByRole("textbox", { name: "Título" })).toHaveValue("");
        await expect(itemDaLista(page, dados.titulo)).toBeVisible();
    });

    test("E08 exclui um compromisso @smoke", async ({ page, request }) => {
        const dados = compromisso("excluir");
        await criarViaApi(request, dados);
        await page.goto("/");

        await itemDaLista(page, dados.titulo).getByRole("button", { name: "Excluir" }).click();

        await expect(itemDaLista(page, dados.titulo)).toHaveCount(0);
        await page.reload();
        await expect(itemDaLista(page, dados.titulo)).toHaveCount(0);
    });

    test("E09 sai do modo edição ao excluir o item em edição", async ({ page, request }) => {
        const dados = compromisso("excluir em edição");
        await criarViaApi(request, dados);
        await page.goto("/");

        const item = itemDaLista(page, dados.titulo);
        await item.getByRole("button", { name: "Editar" }).click();
        await expect(page.getByRole("heading", { name: "Editar compromisso" })).toBeVisible();
        await item.getByRole("button", { name: "Excluir" }).click();

        await expect(item).toHaveCount(0);
        await expect(page.getByRole("heading", { name: "Novo compromisso" })).toBeVisible();
    });

    test("E10 agrupa por dia e ordena por hora", async ({ page, request }) => {
        await criarViaApi(request, compromisso("tarde", { hora: "15:00" }));
        await criarViaApi(request, compromisso("manhã", { hora: "08:00" }));
        await criarViaApi(request, compromisso("dia seguinte", { data: "2030-03-16", hora: "07:00" }));
        await page.goto("/");

        const dia15 = page.locator(".agenda-day").filter({ has: page.getByRole("heading", { name: DIA_TEXTO }) });
        await expect(dia15.getByRole("listitem")).toHaveCount(2);
        await expect(dia15.getByRole("listitem").nth(0)).toContainText(`${PREFIXO} manhã`);
        await expect(dia15.getByRole("listitem").nth(1)).toContainText(`${PREFIXO} tarde`);

        const dia16 = page.locator(".agenda-day").filter({ has: page.getByRole("heading", { name: /16 de março de 2030/ }) });
        await expect(dia16.getByRole("listitem")).toContainText(`${PREFIXO} dia seguinte`);
    });

    test("E11 mostra o compromisso no dia correto do calendário", async ({ page, request }) => {
        const dados = compromisso("calendário", { hora: "10:45" });
        await criarViaApi(request, dados);
        await page.goto("/");

        const calendario = page.getByRole("complementary");
        await calendario.getByRole("textbox", { name: "Selecionar mês" }).fill("2030-03");

        const celula = calendario
            .locator(".agenda-calendar-day")
            .filter({ has: page.getByText("15", { exact: true }) });
        await expect(celula.getByTitle(`10:45 ${dados.titulo}`)).toBeVisible();
    });

    test("E12 navega entre meses atravessando a virada de ano", async ({ page }) => {
        await page.goto("/");
        const mes = page.getByRole("textbox", { name: "Selecionar mês" });

        await mes.fill("2026-12");
        await page.getByRole("button", { name: "Próximo mês" }).click();
        await expect(mes).toHaveValue("2027-01");

        await page.getByRole("button", { name: "Mês anterior" }).click();
        await page.getByRole("button", { name: "Mês anterior" }).click();
        await expect(mes).toHaveValue("2026-11");
    });
});
