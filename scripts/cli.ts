#!/usr/bin/env node
/**
 * CLI utility for MaintainX configuration management
 */

import { FoundryMigration } from './migrations/add-foundry-safe';
import { ConfigFileService } from '../src/utils/configFileService';

interface Command {
  name: string;
  description: string;
  action: (args: string[]) => Promise<void> | void;
}

const commands: Command[] = [
  {
    name: 'migrate-foundry',
    description: 'Safely add Palantir Foundry to configuration with backup',
    action: async (args: string[]) => {
      const configPath = args[0];
      try {
        console.log('🚀 Starting Foundry migration...');
        const outputPath = FoundryMigration.migrate(configPath);
        console.log(`✅ Migration completed: ${outputPath}`);
      } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
      }
    }
  },
  {
    name: 'config-info',
    description: 'Display current configuration information',
    action: () => {
      try {
        const info = ConfigFileService.getConfigInfo();
        console.log('📊 Configuration Information:');
        console.log(`   Source: ${info.source.type}${info.source.path ? ` (${info.source.path})` : ''}`);
        console.log(`   Size: ${info.size}`);
        console.log(`   Last Modified: ${info.lastModified}`);
        console.log(`   Sections: ${info.sectionsCount}`);
        console.log(`   Brands: ${info.brandsCount}`);
      } catch (error) {
        console.error('❌ Failed to get config info:', error);
        process.exit(1);
      }
    }
  },
  {
    name: 'download-config',
    description: 'Download current configuration as JSON file',
    action: (args: string[]) => {
      try {
        const filename = args[0];
        ConfigFileService.downloadConfigAsFile(filename);
        console.log(`✅ Configuration downloaded: ${filename || 'auto-generated name'}`);
      } catch (error) {
        console.error('❌ Failed to download config:', error);
        process.exit(1);
      }
    }
  },
  {
    name: 'create-rollback',
    description: 'Create a rollback point with description',
    action: (args: string[]) => {
      try {
        const description = args.join(' ') || 'Manual rollback point';
        const rollback = ConfigFileService.createRollbackPackage(description);
        console.log(`✅ Rollback point created: ${rollback.backupId}`);
        console.log(`   Description: ${description}`);
        console.log(`   Timestamp: ${rollback.timestamp}`);
      } catch (error) {
        console.error('❌ Failed to create rollback:', error);
        process.exit(1);
      }
    }
  },
  {
    name: 'help',
    description: 'Show this help message',
    action: () => {
      showHelp();
    }
  }
];

function showHelp() {
  console.log('🔧 MaintainX Configuration CLI');
  console.log('');
  console.log('Usage: npm run cli <command> [args...]');
  console.log('');
  console.log('Commands:');
  commands.forEach(cmd => {
    console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  npm run cli migrate-foundry config.json');
  console.log('  npm run cli config-info');
  console.log('  npm run cli download-config my-config.json');
  console.log('  npm run cli create-rollback "Before major changes"');
}

function main() {
  const args = process.argv.slice(2);
  const commandName = args[0];
  const commandArgs = args.slice(1);

  if (!commandName) {
    showHelp();
    return;
  }

  const command = commands.find(cmd => cmd.name === commandName);
  
  if (!command) {
    console.error(`❌ Unknown command: ${commandName}`);
    console.log('');
    showHelp();
    process.exit(1);
  }

  try {
    Promise.resolve(command.action(commandArgs))
      .then(() => {
        // Command completed successfully
      })
      .catch((error) => {
        console.error('❌ Command failed:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('❌ Command failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { commands };