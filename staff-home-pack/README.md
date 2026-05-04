# AngelCare Staff Home Inject Pack

Installs a new `/staff-home` protected page and changes login redirection to land there after authentication.

Run from your project root:

```bash
unzip STAFF_HOME_INJECT_PACK.zip -d staff-home-pack
cp -R staff-home-pack/* .
bash INJECT_STAFF_HOME.sh
npm run dev
```
