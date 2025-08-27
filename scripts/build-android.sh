#!/bin/bash

# CycleWise Android Build Script
# This script builds the PWA and packages it as an Android TWA

set -e

echo "🚀 Building CycleWise Android App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed.${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed.${NC}"
        exit 1
    fi
    
    if ! command -v gradle &> /dev/null; then
        echo -e "${YELLOW}⚠️  Gradle not found in PATH. Using gradlew instead.${NC}"
    fi
    
    echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

# Build the PWA
build_pwa() {
    echo -e "${BLUE}Building PWA...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing npm dependencies...${NC}"
        npm install
    fi
    
    # Build the PWA
    echo -e "${YELLOW}Building Next.js app...${NC}"
    npm run build
    
    # Export static files
    echo -e "${YELLOW}Exporting static files...${NC}"
    npm run export || npm run build
    
    echo -e "${GREEN}✅ PWA build completed${NC}"
}

# Prepare Android project
prepare_android() {
    echo -e "${BLUE}Preparing Android project...${NC}"
    
    # Create android directory if it doesn't exist
    if [ ! -d "android" ]; then
        echo -e "${YELLOW}Creating Android project structure...${NC}"
        mkdir -p android/app/src/main/{java/com/cyclewise/app,res/{drawable,mipmap,values,xml}}
    fi
    
    # Copy PWA assets to Android
    if [ -d "out" ]; then
        echo -e "${YELLOW}Copying PWA assets...${NC}"
        mkdir -p android/app/src/main/assets/www
        cp -r out/* android/app/src/main/assets/www/ 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ Android project prepared${NC}"
}

# Generate Android resources
generate_android_resources() {
    echo -e "${BLUE}Generating Android resources...${NC}"
    
    # Create strings.xml
    cat > android/app/src/main/res/values/strings.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">CycleWise</string>
    <string name="app_description">Privacy-first period tracker</string>
    <string name="notification_channel_name">CycleWise Reminders</string>
    <string name="notification_channel_description">Period and wellness reminders</string>
</resources>
EOF

    # Create colors.xml
    cat > android/app/src/main/res/values/colors.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#EC4899</color>
    <color name="colorPrimaryDark">#DB2777</color>
    <color name="colorAccent">#EC4899</color>
    <color name="white">#FFFFFF</color>
    <color name="black">#000000</color>
</resources>
EOF

    # Create styles.xml
    cat > android/app/src/main/res/values/styles.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.CycleWise" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
    
    <style name="Theme.CycleWise.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>
EOF

    # Create file_paths.xml for FileProvider
    cat > android/app/src/main/res/xml/file_paths.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="my_images" path="Pictures" />
    <external-files-path name="my_docs" path="Documents" />
</paths>
EOF

    # Create backup rules
    cat > android/app/src/main/res/xml/backup_rules.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="device_prefs.xml"/>
    <exclude domain="database" path="databases/"/>
</full-backup-content>
EOF

    # Create data extraction rules
    cat > android/app/src/main/res/xml/data_extraction_rules.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="device_prefs.xml"/>
        <exclude domain="database" path="databases/"/>
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="device_prefs.xml"/>
    </device-transfer>
</data-extraction-rules>
EOF

    echo -e "${GREEN}✅ Android resources generated${NC}"
}

# Build Android APK
build_android_apk() {
    echo -e "${BLUE}Building Android APK...${NC}"
    
    cd android
    
    # Make gradlew executable
    if [ -f "gradlew" ]; then
        chmod +x gradlew
        GRADLE_CMD="./gradlew"
    else
        GRADLE_CMD="gradle"
    fi
    
    # Clean and build
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    $GRADLE_CMD clean
    
    echo -e "${YELLOW}Building debug APK...${NC}"
    $GRADLE_CMD assembleDebug
    
    # Check if APK was created
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        echo -e "${GREEN}✅ Debug APK created successfully${NC}"
        echo -e "${GREEN}📱 APK location: android/app/build/outputs/apk/debug/app-debug.apk${NC}"
    else
        echo -e "${RED}❌ Failed to create APK${NC}"
        exit 1
    fi
    
    cd ..
}

# Build Android AAB (for Play Store)
build_android_bundle() {
    echo -e "${BLUE}Building Android App Bundle...${NC}"
    
    cd android
    
    if [ -f "gradlew" ]; then
        GRADLE_CMD="./gradlew"
    else
        GRADLE_CMD="gradle"
    fi
    
    echo -e "${YELLOW}Building release bundle...${NC}"
    $GRADLE_CMD bundleRelease
    
    # Check if AAB was created
    if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
        echo -e "${GREEN}✅ Release AAB created successfully${NC}"
        echo -e "${GREEN}📱 AAB location: android/app/build/outputs/bundle/release/app-release.aab${NC}"
    else
        echo -e "${RED}❌ Failed to create AAB${NC}"
        exit 1
    fi
    
    cd ..
}

# Main build process
main() {
    echo -e "${GREEN}🚀 CycleWise Android Build Starting...${NC}"
    
    check_dependencies
    build_pwa
    prepare_android
    generate_android_resources
    
    # Build based on argument
    case "${1:-debug}" in
        "debug")
            build_android_apk
            ;;
        "release")
            build_android_bundle
            ;;
        "both")
            build_android_apk
            build_android_bundle
            ;;
        *)
            echo -e "${RED}❌ Invalid build type. Use: debug, release, or both${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}🎉 Build completed successfully!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  • Test the APK on a device or emulator"
    echo -e "  • For Play Store: Upload the AAB file"
    echo -e "  • Update the asset links verification"
}

# Handle script arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "CycleWise Android Build Script"
    echo ""
    echo "Usage: $0 [build_type]"
    echo ""
    echo "Build types:"
    echo "  debug   - Build debug APK (default)"
    echo "  release - Build release AAB for Play Store"
    echo "  both    - Build both debug APK and release AAB"
    echo ""
    echo "Options:"
    echo "  --help, -h  Show this help message"
    exit 0
fi

# Run main function
main "$1"
