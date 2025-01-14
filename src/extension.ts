import * as vscode from 'vscode';
import { updateSettings } from './framework-settings';
import { selectFramework, createApp, createModule, runAddin } from './explorer-actions';

export function activate(context: vscode.ExtensionContext) {

	updateSettings();

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
	  if (event.affectsConfiguration('shinyframeworks.defaultLanguage') ||
		event.affectsConfiguration('shinyframeworks.defaultFramework')) {
		updateSettings();
	  }
	}));

	context.subscriptions.push(
		vscode.commands.registerCommand('shinyframeworks.selectFramework', selectFramework),
		vscode.commands.registerCommand('shinyframeworks.createModule', createModule),
		vscode.commands.registerCommand('shinyframeworks.createApp', createApp),
		vscode.commands.registerCommand('shinyframeworks.Addins', runAddin)
	  );

}

export function deactivate() {}
