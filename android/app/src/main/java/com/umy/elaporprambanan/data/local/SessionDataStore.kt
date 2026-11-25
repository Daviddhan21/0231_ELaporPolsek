package com.umy.elaporprambanan.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.umy.elaporprambanan.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "elapor_session")

class SessionDataStore(private val context: Context) {

    companion object {
        val KEY_ACCESS_TOKEN = stringPreferencesKey("access_token")
        val KEY_REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val KEY_USER_ID = stringPreferencesKey("user_id")
        val KEY_ROLE = stringPreferencesKey("role")
        val KEY_FULL_NAME = stringPreferencesKey("full_name")
        val KEY_BADGE_NUMBER = stringPreferencesKey("badge_number")
        val KEY_UNIT_NAME = stringPreferencesKey("unit_name")
        val KEY_BASE_URL = stringPreferencesKey("active_base_url")
    }

    val accessTokenFlow: Flow<String?> = context.dataStore.data.map { it[KEY_ACCESS_TOKEN] }
    val roleFlow: Flow<String?> = context.dataStore.data.map { it[KEY_ROLE] }
    val baseUrlFlow: Flow<String> = context.dataStore.data.map {
        it[KEY_BASE_URL] ?: BuildConfig.EMULATOR_BASE_URL
    }

    suspend fun getAccessToken(): String? = accessTokenFlow.first()
    suspend fun getBaseUrl(): String = baseUrlFlow.first()

    suspend fun setBaseUrl(url: String) {
        val normalized = if (url.endsWith("/")) url else "$url/"
        context.dataStore.edit { it[KEY_BASE_URL] = normalized }
    }

    suspend fun saveSession(
        accessToken: String,
        refreshToken: String,
        userId: String,
        role: String,
        fullName: String,
        badgeNumber: String? = null,
        unitName: String? = null
    ) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ACCESS_TOKEN] = accessToken
            prefs[KEY_REFRESH_TOKEN] = refreshToken
            prefs[KEY_USER_ID] = userId
            prefs[KEY_ROLE] = role
            prefs[KEY_FULL_NAME] = fullName
            badgeNumber?.let { prefs[KEY_BADGE_NUMBER] = it }
            unitName?.let { prefs[KEY_UNIT_NAME] = it }
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            val savedUrl = prefs[KEY_BASE_URL]
            prefs.clear()
            if (savedUrl != null) prefs[KEY_BASE_URL] = savedUrl
        }
    }
}
