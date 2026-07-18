class LoginPage {
  constructor(page) {
    this.page = page;

    // Localizadores de los elementos de la página de login

    // Localizadores de los campos y botones
    // Sustituimos getByRole por selectores de atributo exactos para evitar timeouts de cálculo de accesibilidad (flakiness)
    this.userInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');

    // Localizador del mensaje de error
    this.invalidCredentialsMessage = page.locator('.oxd-alert-content-text');

    //Tipo imagen
    this.logosup = page.getByRole('img', { name: 'company-branding' });
    this.logoRight = page.getByRole('img', { name: 'orangehrm-logo' });


    //tipo texto
    this.headerLogin = page.getByRole('heading', { name: 'Login' });
    this.labelUsername = page.getByText('Username', { exact: true });
    this.labelPassword = page.getByText('Password', { exact: true });

    //Localizadores de footer
    this.forgotPassword = page.getByText('Forgot your password?', { exact: true });
    this.version = page.getByText('OrangeHRM OS 5.8', { exact: true });
    this.copyright = page.getByText('© 2005 - 2026 OrangeHRM, Inc. All rights reserved.', { exact: true });

    // Texto de ejemplo de credenciales
    this.usernameExample = page.getByText('Username : Admin');
    this.passwordExample = page.getByText('Password : admin123');

    // Enlaces sociales
    this.linkedinLink = page.locator('a[href*="linkedin"]');
    this.facebookLink = page.locator('a[href*="facebook"]');
    this.twitterLink = page.locator('a[href*="twitter"]');
    this.youtubeLink = page.locator('a[href*="youtube"]');

    // Enlace en el copyright
    this.orangehrmLink = page.getByRole('link', { name: 'OrangeHRM, Inc' });

    // Mensajes de required
    this.requiredMessages = page.locator('text=Required');

  }

  async goto() {
    // Para entornos SPA inestables como OrangeHRM demo, esperamos a que la página cargue su estructura básica.
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', { waitUntil: 'load', timeout: 60000 });

    // En lugar de una espera estática, esperamos a que el input sea visible.
    // Esto es mucho más robusto para servidores lentos o bajo carga de trabajadores (workers).
    await this.userInput.waitFor({ state: 'visible', timeout: 30000 });
  }



  async login(username, password) {
    await this.userInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }


  async invalidCredentials() {
    await this.invalidCredentialsMessage.waitFor({ state: 'visible' });
    return await this.invalidCredentialsMessage.textContent();
  }

  async validacionImagenesLogin() {
    await this.logosup.waitFor({ state: 'visible' });
    await this.logoRight.waitFor({ state: 'visible' });
    return await this.logosup.isVisible() && await this.logoRight.isVisible();
  }



  async validarElementosVisibles(elementos, nombres) {
    for (let i = 0; i < elementos.length; i++) {
      const elemento = elementos[i];
      const nombre = nombres[i];
      await elemento.waitFor({ state: 'visible' });
      const isVisible = await elemento.isVisible();
      if (!isVisible) {
        throw new Error(`El elemento "${nombre}" no es visible en la página de login.`);
      }
    }
  }

}

module.exports = { LoginPage };
