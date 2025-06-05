import chalk from 'chalk';
import figlet from 'figlet';

// Função para exibir banner de boas-vindas
export function showWelcomeBanner() {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync('NestJS CLI', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      }),
    ),
  );
  console.log(chalk.yellow('🚀 Gerador de Boilerplate DMC para NestJS\n'));
}
