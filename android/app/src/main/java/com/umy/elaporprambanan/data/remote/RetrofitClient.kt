package com.umy.elaporprambanan.data.remote

import com.umy.elaporprambanan.data.local.SessionDataStore
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private var currentBaseUrl: String? = null
    private var retrofitInstance: Retrofit? = null

    fun getRetrofit(sessionDataStore: SessionDataStore): Retrofit {
        val activeUrl = runBlocking { sessionDataStore.getBaseUrl() }
        if (retrofitInstance == null || currentBaseUrl != activeUrl) {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(AuthInterceptor(sessionDataStore))
                .addInterceptor(logging)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build()

            currentBaseUrl = activeUrl
            retrofitInstance = Retrofit.Builder()
                .baseUrl(activeUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
        }
        return retrofitInstance!!
    }
}
