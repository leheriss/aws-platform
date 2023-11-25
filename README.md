# AWS Platform project

This project is a Typescript CDK project to deploy an AWS Platform components.

It is trying to follow [CDK best practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html) as much as possible.
The `cdk.json` file tells CDK Toolkit how to execute your app.

## Useful commands

---

- `npm run cdk:deploy` deploys these stacks to the specified AWS account/region
- `npm run cdk:diff` compares deployed stack with current state
- `npm run cdk:synth` emits the synthesized CloudFormation template
- `cdk watch` watches for changes and deploy on the fly (ONLY IN DEV ENV)

## 🧰 Prerequisite

- 🛠 AWS CLI Installed & Configured
- 🛠 AWS CDK version 2.x Installed & Configured
- [node](https://nodejs.org/en/) runtime with [npm](https://npmjs.com/)

## ⚙️ Setting up the environment

- Run `npm i` from the root folder
- Set your environment variables
  - AWS_ORGANIZATIONS_ID: Id of your AWS Organizations
  - ROOT_OU_ID: Id of your Root Organization
  - ADMIN_EMAILS_PARAMETER_NAME: Name of the Parameter in AWS Parameter Store that stores SRE administrators emails
  - MGMT_ACCOUNT_ID: Id of the Management Account in AWS Organizations
  - IDENTITY_STORE_ID: The Identity Center Id (used by the `getAwsSSOGroups` context script)
  - SSO_INSTANCE_ARN: The Identity Center Instance id
- Run `yarn prepare` to enable husky pre-commit/pre-push actions

## 🚀 Deployment using cdk

```bash
# Make sure you in root directory
npm i

# Check what will be deployed and deploy
npm run cdk:diff
# If changes are relevant, then deploy
npm run cdk:deploy
```

## 🧹 CleanUp

If you want to destroy all the resources created by the stack, Execute the below command to delete the stack, or _you can delete the stack from console as well_.

```bash
cdk destroy *
```

This is not an exhaustive list, please carry out other necessary steps as maybe applicable to your needs.

Be aware that in this particular case:

- you need to first **empty the deployed buckets**.
- You need to **empty every Organization Units** deployed by the project because non-empty OU cannot be deleted.
- If you have some CloudFormation StackSets, you must remove StackSet instances before destroying

> ⚠️ AWS Organizations does not support doing 2 operations at the same time on the same SCP 🤷‍♀️ . So you may experience trouble deleting those resources.

## 🏗️ Architecture

---

This project manages :

- The account factory: Account provisionning and deprovisionning
- Organization Units (OU) creation/deletion
- Service Control Policies (SCP) creation/deletion
- Organizations management tools (Budgets, organization trails ...)
- AWS Identity Center resources (permission sets)

For more information on AWS Organizations concepts, please refer to [AWS documentation and best practices](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_getting-started_concepts.html).

### 🚧 Constructs and resources

#### **Budgets**

This [construct](./constructs/budget.ts) extends the AWS CDK [Budget Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_budgets.CfnBudget.html) which is a L1 construct.

In the management account, we create 1 budget for now which is a global Budget: to sum up all cost in every platform's accounts. But it is possible to add others targetting specific services.

For example:

```js
new Budget(this, 'APIGatewayBudget', {
  limitAmountUSD: 3000,
  emails: adminEmails,
  costFilters: {
    Service: ['Amazon API Gateway'],
  },
});
```

Each of those budget is created with an amount limit USD and with 3 notifications.

Notifications are sent to administrators, stored in a parameter of the Parameter Store (ADMIN_EMAILS_PARAMETER_NAME environment variable).

You can find budget declarations in the [FinOps stack](./stacks/finops.ts).

#### **Organization Trail**

This resource allows to log everything actions from all the AWS account of your organization.
It needs a S3 trail bucket and a CloudTrail organization trail.

You can find this in the [Logging stack](./stacks/logging.ts).

> Be careful if you want to delete this stack, the bucket must be emptied before.

#### **AWS Lambda functions**

This [construct](./lib/constructs/lambda.ts) extends the AWS CDK [NodeJS Lambda Construct](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html).

#### **Init Account**

The [initAccount](./lib/constructs/initAccount.ts) construct deploys a [ClouFormation StackSet](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/what-is-cfnstacksets.html) that create resources in the newly created account depending on the Organization Unit they are in.

For now it deploys 2 roles in accounts of the Pos Pro Organization Unit:

- `tf-executor`: for Terraform Cloud executions
- `github-oidc`: for GitHub Actions workflow

#### **SSO Permission Set**

The [SSOPermissionSet](./lib/constructs/ssoPermissionSet.ts) extends the [CfnPermissionSet](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sso.CfnPermissionSet.html) CDK construct. It fixes a default name and a default session duration. Of course, those two attributes can be overwritten.

All permission sets are declared in another construct : [SSOPermissionSets](./lib/constructs/ssoPermissionSets.ts). Indeed, it is just to separate this part from the stack (pure esthetic stuff) and avoid having a 5000 lines file.

All inline policies are declare in [./policies](./lib/policies/) folder.

#### **SSO Assignment**

The [SSOAssignment](./lib/constructs/ssoAssignments.ts) takes a list of [assignments](./lib/types.ts) and create a CDK [CfnAssignment](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sso.CfnAssignment.html).

An assignment is the link between an AWS SSO group and a list of permission sets.
As an assignment MUST target an AWS account, each permission set is associated to an account and this forms an [AccountPermissionSet](./lib/types.ts).

For example:

```js
{
  group: getGroupWithName('Admin'),
  accountPermissionSets: [
    {
      permissionSet: permissionSets.admin,
      account: 123456789101,
    },
  ],
},
```

This is an Assignment. It associates the Admin SSO group to the `admin` permission set for `123456789101` account.
If I add an item to accountPermissionSets, like this:

```js
{
  group: getGroupWithName('Admin'),
  accountPermissionSets: [
    {
      permissionSet: permissionSets.admin,
      account: 123456789101,
    },
    {
      permissionSet: permissionSets.viewOnly,
      account: 918203837466,
    },
  ],
},
```

This will give to the `Admin` group the `admin` permission to `123456789101` account and the `viewOnly` permission to `918203837466` account.

### Stacks

Multiple CloudFormation stacks are deployed by this project.

#### 🏭 **aws-account-factory**

This [stack](./stacks/aws-account-factory.ts) deploys:

- `createAccount`:
  Creates the AWS account => waits for its creation => adds it to the right OU depending on the `accountType` parameter given => adds the billing alternate contact
- `deleteAccount`:
  Fetches the OU id of the account we want to delete, using the `accountId` given parameter => moves the account to the `PENDING-DELETION` OU => closes the account.

> Be aware that there is a quota for the number of deletable account in a month (20% of the total number of accounts). So you might get the `ConstraintViolationException` with the error message `You have exceeded close account quota for the past 30 days.`. In that case, the `delete-account` lambda will just put the account in the `Pending Deletion` Organizational Unit where the `Deny Actions` SCP blocks every action but the one to close the account. You'll have to retry to delete the account the next month.

> For more information on what implies "closing account" in AWS, please refer to the [AWS documentation](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_accounts_close.html).

> You can find Lambda Typescript code in the [lambda folder](./lambdas). And their CDK declaration in the [accountFactory stack](./stacks/aws-account-factory.ts)

#### 💰 **finops**

This [stack](./stacks/finops.ts) deploys billing related resources as budgets for example.

#### 👀 **logging**

This [stack](./stacks/logging.ts) deploys monitoring related resources. For now it only deploys a Global Organization trail.

#### 🫀 **aws-organizations**

This [stack](./stacks/aws-organizations.ts) deploys AWS Organizations resources such as:

- Service Control Policies
- Organization Units

#### 🪪 **aws-identity-center**

This [stack](./stacks/aws-identiry-center.ts):

- instantiates all permission sets
- declares all assignment of groups to permission set/account

## 📜 Scripts

- [getAwsSSOGroups](./scripts/getAwsSSOGroups.ts): retrieve AWS SSO group list from AWS SSO.
  These groups are used as context variable by CDK, for the stack to dynamically get access to all SSO groups (instead of having them hardcoded).
- [getGroupByName](./scripts/getGroupWithName.ts): retrieve an Identity Center group id, given its name

## Unit tests

---

CDK's unit tests are in [./test](./test/aws-sso.test.ts) directory.
The unit test library used is [jest](https://jestjs.io/docs/getting-started) and its configuration is [here](./jest.config.js).

# TODOS:

- check husky configuration
