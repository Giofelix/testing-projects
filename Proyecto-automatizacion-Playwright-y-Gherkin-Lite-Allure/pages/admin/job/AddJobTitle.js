const { expect } = require('@playwright/test');

class AddJobTitle {
    constructor(page) {
        // Input field
        this.jobTitle = page.locator('.oxd-input-group:has(label:has-text("Job Title")) input');

        // Textarea with placeholder "Type description here"
        this.jobDescription = page.locator('textarea[placeholder="Type description here"]')

        //this.jobDescription.page.locator('input.oxd-file-input');

        // Textarea with placeholder "Add note"
        this.addNote = page.locator('textarea[placeholder="Add note"]')

        // Cancel button
        this.buttonCancel = page.locator('button:has-text("Cancel")')

        // Save button
        this.buttonSave = page.locator('button:has-text("Save")')

        this.ConfirmmationRegister = page.locator('.oxd-toast-container .oxd-toast--success');
    }


    async fillForm(jobTitle, jobDescription, addNote) {
        await this.jobTitle.fill(jobTitle);
        await this.jobDescription.fill(jobDescription);
        await this.addNote.fill(addNote);
    }

    async clickSave() {
        await this.buttonSave.click();
    }

    async clickCancel() {
        await this.buttonCancel.click();
    }

    async validateSuccessMessage() {
        await expect(this.ConfirmmationRegister).toBeVisible();
        await expect(this.ConfirmmationRegister).toHaveText(/Successfully Saved/);
    }
}

module.exports = { AddJobTitle };