buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:9.4.1")
        // Pin KGP above AGP 9's built-in minimum (2.2.10)
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.21")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register<Delete>("clean") {
    delete("build")
}
