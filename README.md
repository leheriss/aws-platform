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
- [Create an AWS account](https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-creating.html) if you never created one: this will be your management account.
- [Enable AWS Organization](https://docs.aws.amazon.com/accounts/latest/reference/using-orgs.html) and [AWS Identity Center](https://docs.aws.amazon.com/SetUp/latest/UserGuide/setup-enableIdC.html) in your AWS management account: The AWS Organizations and SSO instance are not created by this tool. SSO instances are **regional**, so please create it in `eu-west-1`.

## ⚙️ Setting up the environment

- Run `npm i` from the root folder
- Set your CDK context variables: either in the cdk.context.json, in the command line or as CDK*CONTEXT*<variable> (see [documentation about context](https://docs.aws.amazon.com/cdk/v2/guide/context.html))
- Run `yarn prepare` to enable husky pre-commit/pre-push actions

## Context variables

- adminEmailsParameterName: The AWS Parameter Store parameter containing your admin email

  > Must be created before deploy the CDK app

- managementAccountId: The account Id of your AWS management account

- ssoInstanceArn: The instance ID of you Identity Center instance

- identityStoreId: The ID of your Identity Center Identity Store

- rootOuId: The ID of your Root Organization (should look like this: `r-12345`)

- awsOrganizationsId: The ID of your AWS Organizations (should look like this: `o-12345678`)

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
- AWS Identity Center resources (permission sets and groups)

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
  groupId: <GroupId>,
  groupName: <GroupName>,
  accountPermissionSets: [
    {
      permissionSet: <permissionSet>,
      account: 123456789101,
    },
  ],
},
```

This is an Assignment. It associates the Admin SSO group to the `admin` permission set for `123456789101` account.
If I add an item to accountPermissionSets, like this:

```js
{
  groupId: <GroupId>,
  groupName: <GroupName>,
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

#### SSO groups

SSO groups are created in the [AwsIdentityCenter Stack](./stacks/aws-identity-center.ts) using a [custom construct](./constructs/identityCenterGroup.ts):

```javascript
const group = new IdentityCenterGroup(this, 'group', {
  groupName: 'GroupName',
  identityStoreId,
});
```

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

Those resources must be described in a Yaml file that you have to give to the stask like this:

```javascript
const organizationsStack = new AwsOrganizationsStack(app, 'AwsOrganizationsStack', {
  rootOrganizationId: rootOuId,
  accountId: managementAccountId,
  configFilePath: './config/organizations.yaml',
});
```

The file must contain 2 keys: `serviceControlPolicies` and `organizationUnits`:

```yaml
organizationUnits:
  - name: App
    parentName: root
serviceControlPolicies:
  - name: DenyLeaveOrganization
    description: 'Policy forbidding leaving the Organization'
    targetOUNames:
      - root
    contentFile: scps/denyLeaveOrganization.json
  - name: DenyActions
    description: 'Policy denying specific actions'
    targetOUNames:
      - root
    contentFile: scps/denyActions.json
```

The root OU must not be defined in this file, it already exists by default. If you need to reference it as a parent OU for one of your Organization Units OR as a targetOU for your SCP, it must be called `root`.

SCP content must be referenced either as a file: you must give the file path. Or directly the content if you prefer.

There is one Organization Unit created by default that you cannot touch in terms of SCP: the `Pendind Deletion` OU, it is used by the delete account lambdas to store the account while it is suspended or scheduled for deletion.

#### 🪪 **aws-identity-center**

This [stack](./stacks/aws-identiry-center.ts):

- instantiates all permission sets
- declares all assignment of groups to permission set/account
- create SSO groups

Those resources are described in a YAML file and the file path must be givent to the stack:

```javascript
new AwsIdentityCenterStack(app, 'AwsIdentityCenterStack', {
  accountId: managementAccountId,
  ssoInstanceArn,
  identityStoreId,
  configFilePath: './config/identityCenter.yaml',
});
```

The file can contain this 3 keys: `group` and `permissionSets` and `assignment`. To create the assignment, the group and permissionSet referenced must be created in the group and permissionSets sections:

```yaml
groups:
  - name: Administrators
  - name: ReadOnly
permissionSets:
  - name: Administrators
    managedPolicies:
      - 'arn:aws:iam::aws:policy/AdministratorAccess'
  - name: ViewOnly
    managedPolicies:
      - 'arn:aws:iam::aws:policy/job-function/ViewOnlyAccess'
assignments:
  - accountId: 'xxxxxx'
    permissions:
      - groupName: ReadOnly
        permissionSets:
          - ViewOnly
      - groupName: Administrators
        permissionSets:
          - Administrators
```

To create an assignment, you must give the account ID (this is why the config file is not to be commited).

The permissionSet can also contain a `description`, an `inlinePolicy` (as a file path or directly the content) and a `duration`.

## Unit tests

---

CDK's unit tests are in [./test](./test/aws-sso.test.ts) directory.
The unit test library used is [jest](https://jestjs.io/docs/getting-started) and its configuration is [here](./jest.config.js).
