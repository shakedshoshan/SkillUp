#!/usr/bin/env node
import dotenv from 'dotenv';
import { JsonCourseBuilderAgent } from './course-builder-json';
import * as path from 'path';

// Load environment variables
dotenv.config();

/**
 * CLI Runner for JSON-based Course Builder Agent
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'run':
      if (args.length < 2) {
        console.error('❌ Error: JSON file path is required');
        console.log('Usage: npm run course-agent:json run <json-file-path>');
        return;
      }
      await runFromJsonFile(args[1]);
      break;

    case 'create-example':
      const examplePath = args[1] || './course-activation-example.json';
      createExampleFile(examplePath);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      break;
  }
}

/**
 * Run course generation from JSON file
 */
async function runFromJsonFile(jsonFilePath: string): Promise<void> {
  try {
    const agent = new JsonCourseBuilderAgent();
    const courseId = await agent.processJsonFile(jsonFilePath);
    
    if (courseId) {
      console.log(`\n✅ Course generation completed successfully!`);
      console.log(`🆔 Course ID: ${courseId}`);
      process.exit(0);
    } else {
      console.log(`\n❌ Course generation failed!`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

/**
 * Create example JSON activation file
 */
function createExampleFile(filePath: string): void {
  try {
    JsonCourseBuilderAgent.createExampleJsonFile(filePath);
    console.log('\n📋 Example JSON structure:');
    console.log(`{
  "course_topic": "Introduction to Machine Learning",
  "search_web": false,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "output_file": "./output/course_result.json"
}`);
    console.log('\n🔧 To run the agent with this file:');
    console.log(`npm run course-agent:json run ${filePath}`);
  } catch (error) {
    console.error('❌ Error creating example file:', error);
    process.exit(1);
  }
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log('🤖 SkillUp Course Builder Agent - JSON Mode');
  console.log('==========================================');
  console.log('\nUsage:');
  console.log('  npm run course-agent:json <command> [options]');
  console.log('\nCommands:');
  console.log('  run <json-file>        Process course generation from JSON file');
  console.log('  create-example [path]  Create an example JSON activation file');
  console.log('\nExamples:');
  console.log('  npm run course-agent:json create-example');
  console.log('  npm run course-agent:json create-example ./my-course-config.json');
  console.log('  npm run course-agent:json run ./course-activation.json');
  console.log('\nJSON Structure:');
  console.log(`  {
    "course_topic": "Your Course Topic",
    "search_web": false,
    "user_id": "uuid-v4-string",
    "output_file": "./optional/output/path.json"
  }`);
  console.log('\nFor more information, see the README.md file.');
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
} 